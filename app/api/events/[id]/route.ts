import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseEventId } from "@/lib/event/recurrence";
import { colorToDb } from "@/lib/event/colors";

async function loadAndAuthorize(id: string, userId: string) {
  const { eventId } = parseEventId(id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      organizationId: true,
      creatorId: true,
      visibility: true,
      title: true,
      startsAt: true,
      endsAt: true,
      recurrence: true,
    },
  });
  if (!event) return { error: "Not found", status: 404 as const };

  // Schreibrecht: Creator oder Org-COORDINATOR/ADMIN
  if (event.creatorId === userId) return { event };

  if (event.organizationId) {
    const m = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: event.organizationId,
          userId,
        },
      },
      select: { role: true },
    });
    if (m && (m.role === "COORDINATOR" || m.role === "ADMIN")) {
      return { event };
    }
  }

  return { error: "Keine Berechtigung.", status: 403 as const };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth_ = await loadAndAuthorize(id, session.user.id);
  if ("error" in auth_) {
    return NextResponse.json({ error: auth_.error }, { status: auth_.status });
  }
  const { event } = auth_;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if ("description" in body) {
    data.description = body.description ? String(body.description) : null;
  }
  if ("location" in body) {
    data.location = body.location ? String(body.location) : null;
  }
  if (body.start) {
    const d = new Date(body.start);
    if (!isNaN(d.getTime())) data.startsAt = d;
  }
  if (body.end) {
    const d = new Date(body.end);
    if (!isNaN(d.getTime())) data.endsAt = d;
  }
  if ("allDay" in body) {
    data.allDay = Boolean(body.allDay);
  }
  if (body.color) {
    data.color = colorToDb(body.color);
  }
  if (["PUBLIC", "ORGANIZATION", "PRIVATE"].includes(body.visibility)) {
    data.visibility = body.visibility;
  }
  if (["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"].includes(body.recurrence)) {
    data.recurrence = body.recurrence;
  }
  if ("recurrenceEndDate" in body) {
    data.recurrenceEndDate = body.recurrenceEndDate
      ? new Date(body.recurrenceEndDate)
      : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.event.update({
    where: { id: event.id },
    data,
  });

  if (event.organizationId) {
    await prisma.activity.create({
      data: {
        organizationId: event.organizationId,
        userId: session.user.id,
        action: "UPDATED",
        targetType: "event",
        targetId: event.id,
        metadata: { fields: Object.keys(data), title: event.title },
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth_ = await loadAndAuthorize(id, session.user.id);
  if ("error" in auth_) {
    return NextResponse.json({ error: auth_.error }, { status: auth_.status });
  }
  const { event } = auth_;

  await prisma.event.delete({ where: { id: event.id } });

  if (event.organizationId) {
    await prisma.activity.create({
      data: {
        organizationId: event.organizationId,
        userId: session.user.id,
        action: "UPDATED",
        targetType: "event",
        targetId: event.id,
        metadata: { deleted: true, title: event.title },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
