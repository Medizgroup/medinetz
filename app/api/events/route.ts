import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { buildOccurrenceId, expandOccurrences } from "@/lib/event/recurrence";
import { colorToDb, colorToUI } from "@/lib/event/colors";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default-Fenster: 6 Monate rückwärts bis 12 Monate vorwärts
  const now = new Date();
  const windowStart = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const windowEnd = toParam
    ? new Date(toParam)
    : new Date(now.getFullYear(), now.getMonth() + 12, 0);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  // Sichtbar: PUBLIC (instanz-weit) + ORGANIZATION (eigene Orgs) + PRIVATE wenn creator
  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            // Öffentliche Events (gilt instanz-weit)
            { visibility: "PUBLIC" },
            // Org-Events: muss eine Org haben UND ich Mitglied
            {
              visibility: "ORGANIZATION",
              organizationId: { in: orgIds },
            },
            // Private: nur creator selbst
            {
              visibility: "PRIVATE",
              creatorId: session.user.id,
            },
          ],
        },
        { startsAt: { lte: windowEnd } },
        {
          OR: [
            { recurrence: "NONE", endsAt: { gte: windowStart } },
            { recurrence: { not: "NONE" } },
          ],
        },
      ],
    },
    orderBy: { startsAt: "asc" },
  });

  // Expandieren
  const expanded = events.flatMap((e) => {
    const occurrences = expandOccurrences(
      {
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        recurrence: e.recurrence,
        recurrenceEndDate: e.recurrenceEndDate,
      },
      windowStart,
      windowEnd,
    );

    return occurrences.map((occ) => ({
      id:
        e.recurrence === "NONE" ? e.id : buildOccurrenceId(e.id, occ.startsAt),
      title: e.title,
      description: e.description,
      location: e.location,
      start: occ.startsAt,
      end: occ.endsAt,
      allDay: e.allDay,
      color: colorToUI(e.color),
    }));
  });

  return NextResponse.json(expanded);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { error: "Titel ist erforderlich." },
      { status: 400 },
    );
  }

  const startsAt = body.start ? new Date(body.start) : null;
  const endsAt = body.end ? new Date(body.end) : null;
  if (
    !startsAt ||
    !endsAt ||
    isNaN(startsAt.getTime()) ||
    isNaN(endsAt.getTime())
  ) {
    return NextResponse.json(
      { error: "Ungültige Zeitangaben." },
      { status: 400 },
    );
  }
  if (endsAt < startsAt) {
    return NextResponse.json(
      { error: "Ende liegt vor Start." },
      { status: 400 },
    );
  }

  const visibility = ["PUBLIC", "ORGANIZATION", "PRIVATE"].includes(
    body.visibility,
  )
    ? body.visibility
    : "ORGANIZATION";

  const organizationId =
    body.organizationId && body.organizationId !== ""
      ? String(body.organizationId)
      : null;

  // Konsistenz-Validierung
  if (visibility === "ORGANIZATION" && !organizationId) {
    return NextResponse.json(
      {
        error:
          "Bei Sichtbarkeit Organisation muss eine Organisation ausgewählt werden.",
      },
      { status: 400 },
    );
  }
  if (visibility === "PRIVATE" && organizationId) {
    // Private events haben keine Org
    body.organizationId = null;
  }

  // Mitgliedschaft prüfen, wenn Org gesetzt
  if (organizationId) {
    const m = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: session.user.id },
      },
      select: { id: true },
    });
    if (!m) {
      return NextResponse.json(
        { error: "Keine Mitgliedschaft in der Organisation." },
        { status: 403 },
      );
    }
  }

  const recurrence = ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"].includes(
    body.recurrence,
  )
    ? body.recurrence
    : "NONE";
  const recurrenceEndDate =
    recurrence !== "NONE" && body.recurrenceEndDate
      ? new Date(body.recurrenceEndDate)
      : null;

  const created = await prisma.event.create({
    data: {
      title,
      description: body.description ? String(body.description) : null,
      location: body.location ? String(body.location) : null,
      startsAt,
      endsAt,
      allDay: Boolean(body.allDay),
      color: colorToDb(body.color ?? "sky"),
      visibility,
      recurrence,
      recurrenceEndDate,
      creatorId: session.user.id,
      organizationId: visibility === "PRIVATE" ? null : organizationId,
    },
    select: { id: true, title: true, organizationId: true },
  });

  if (created.organizationId) {
    await prisma.activity.create({
      data: {
        organizationId: created.organizationId,
        userId: session.user.id,
        action: "CREATED",
        targetType: "event",
        targetId: created.id,
        metadata: { title: created.title },
      },
    });
  }

  return NextResponse.json({ id: created.id });
}
