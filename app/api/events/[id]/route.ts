import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  parseEventId,
  resolveOccurrenceStart,
  VALID_RECURRENCE,
} from "@/lib/event/recurrence";
import { colorToDb } from "@/lib/event/colors";
import {
  cancelSingleOccurrence,
  setSingleOccurrenceOverride,
  splitSeriesFollowing,
  truncateSeriesBefore,
  type EditScope,
  type OccurrenceFieldUpdates,
} from "@/lib/event/series-mutations";

async function loadAndAuthorize(id: string, userId: string) {
  const { eventId, isOccurrence, occurrenceDay } = parseEventId(id);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event) return { error: "Not found", status: 404 as const };

  // Schreibrecht: Creator oder Org-COORDINATOR/ADMIN
  let allowed = event.creatorId === userId;
  if (!allowed && event.organizationId) {
    const m = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: event.organizationId,
          userId,
        },
      },
      select: { role: true },
    });
    allowed = Boolean(m && (m.role === "COORDINATOR" || m.role === "ADMIN"));
  }
  if (!allowed) return { error: "Keine Berechtigung.", status: 403 as const };

  const occurrenceStart =
    isOccurrence && occurrenceDay
      ? resolveOccurrenceStart(event.startsAt, occurrenceDay)
      : null;

  return { event, isOccurrence, occurrenceStart };
}

function normalizeScope(value: unknown): EditScope {
  return value === "single" || value === "following" || value === "all"
    ? value
    : "all";
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
  const { event, isOccurrence, occurrenceStart } = auth_;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  // scope ist nur relevant, wenn tatsächlich ein Vorkommen einer wiederkehrenden Serie
  // bearbeitet wird — sonst bleibt es bei "all" (die ganze — einmalige — "Serie").
  const scope: EditScope =
    isOccurrence && event.recurrence !== "NONE" && occurrenceStart
      ? normalizeScope(body.scope)
      : "all";

  const fieldUpdates: OccurrenceFieldUpdates = {};
  if (typeof body.title === "string" && body.title.trim()) {
    fieldUpdates.title = body.title.trim();
  }
  if ("description" in body) {
    fieldUpdates.description = body.description ? String(body.description) : null;
  }
  if ("location" in body) {
    fieldUpdates.location = body.location ? String(body.location) : null;
  }
  if (body.start) {
    const d = new Date(body.start);
    if (!isNaN(d.getTime())) fieldUpdates.startsAt = d;
  }
  if (body.end) {
    const d = new Date(body.end);
    if (!isNaN(d.getTime())) fieldUpdates.endsAt = d;
  }
  if ("allDay" in body) {
    fieldUpdates.allDay = Boolean(body.allDay);
  }
  if (body.color) {
    fieldUpdates.color = colorToDb(body.color);
  }

  if (scope === "single" && occurrenceStart) {
    await setSingleOccurrenceOverride(event.id, occurrenceStart, fieldUpdates);
    return NextResponse.json({ ok: true, scope });
  }

  if (scope === "following" && occurrenceStart) {
    await splitSeriesFollowing(event, occurrenceStart, fieldUpdates);

    if (event.organizationId) {
      await prisma.activity.create({
        data: {
          organizationId: event.organizationId,
          userId: session.user.id,
          action: "UPDATED",
          targetType: "event",
          targetId: event.id,
          metadata: { fields: Object.keys(fieldUpdates), title: event.title, scope },
        },
      });
    }
    return NextResponse.json({ ok: true, scope });
  }

  // scope === "all": die Basis-Serie selbst bearbeiten
  const data: Record<string, unknown> = { ...fieldUpdates };
  if (["PUBLIC", "ORGANIZATION", "PRIVATE"].includes(body.visibility)) {
    data.visibility = body.visibility;
  }
  if (VALID_RECURRENCE.includes(body.recurrence)) {
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

  return NextResponse.json({ ok: true, scope });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth_ = await loadAndAuthorize(id, session.user.id);
  if ("error" in auth_) {
    return NextResponse.json({ error: auth_.error }, { status: auth_.status });
  }
  const { event, isOccurrence, occurrenceStart } = auth_;

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const scope: EditScope =
    isOccurrence && event.recurrence !== "NONE" && occurrenceStart
      ? normalizeScope(body?.scope)
      : "all";

  if (scope === "single" && occurrenceStart) {
    await cancelSingleOccurrence(event.id, occurrenceStart);
    return NextResponse.json({ ok: true, scope });
  }

  if (scope === "following" && occurrenceStart) {
    await truncateSeriesBefore(event, occurrenceStart);

    if (event.organizationId) {
      await prisma.activity.create({
        data: {
          organizationId: event.organizationId,
          userId: session.user.id,
          action: "UPDATED",
          targetType: "event",
          targetId: event.id,
          metadata: { truncated: true, title: event.title, scope },
        },
      });
    }
    return NextResponse.json({ ok: true, scope });
  }

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

  return NextResponse.json({ ok: true, scope });
}
