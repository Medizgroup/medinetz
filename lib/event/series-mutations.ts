import type {
  Event as EventRow,
  EventColor,
  EventRecurrence,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { previousOccurrence } from "@/lib/event/recurrence";

export type EditScope = "single" | "following" | "all";

export type OccurrenceFieldUpdates = {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  allDay?: boolean;
  color?: EventColor;
};

/**
 * "Nur dieses Ereignis": legt eine Exception für genau dieses Vorkommen an/aktualisiert sie.
 */
export async function setSingleOccurrenceOverride(
  eventId: string,
  originalStartsAt: Date,
  updates: OccurrenceFieldUpdates,
) {
  return prisma.eventException.upsert({
    where: {
      eventId_originalStartsAt: { eventId, originalStartsAt },
    },
    create: { eventId, originalStartsAt, isCancelled: false, ...updates },
    update: { isCancelled: false, ...updates },
  });
}

/**
 * "Nur dieses Ereignis" löschen: markiert das Vorkommen als storniert, ohne die Serie anzufassen.
 */
export async function cancelSingleOccurrence(
  eventId: string,
  originalStartsAt: Date,
) {
  return prisma.eventException.upsert({
    where: {
      eventId_originalStartsAt: { eventId, originalStartsAt },
    },
    create: { eventId, originalStartsAt, isCancelled: true },
    update: {
      isCancelled: true,
      title: null,
      description: null,
      location: null,
      startsAt: null,
      endsAt: null,
      allDay: null,
      color: null,
    },
  });
}

/**
 * "Dieses und alle folgenden" bearbeiten: die alte Serie endet am Tag vor diesem Vorkommen,
 * eine neue Serie mit denselben Wiederholungs-Einstellungen (und dem alten Enddatum) startet
 * an diesem Vorkommen mit den neuen Werten. Bestehende Exceptions ab diesem Vorkommen wandern
 * zur neuen Serie, die Exception für das Vorkommen selbst wird verworfen (die neue Serie
 * verkörpert diese Änderung jetzt direkt).
 */
export async function splitSeriesFollowing(
  original: EventRow,
  occurrenceStart: Date,
  updates: OccurrenceFieldUpdates,
) {
  const cutoff = previousOccurrence(occurrenceStart, original.recurrence);
  const durationMs = original.endsAt.getTime() - original.startsAt.getTime();

  return prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: original.id },
      data: { recurrenceEndDate: cutoff },
    });

    const newStartsAt = updates.startsAt ?? occurrenceStart;
    const newEndsAt =
      updates.endsAt ?? new Date(newStartsAt.getTime() + durationMs);

    const newEvent = await tx.event.create({
      data: {
        title: updates.title ?? original.title,
        description:
          updates.description !== undefined
            ? updates.description
            : original.description,
        location:
          updates.location !== undefined
            ? updates.location
            : original.location,
        startsAt: newStartsAt,
        endsAt: newEndsAt,
        allDay: updates.allDay ?? original.allDay,
        color: updates.color ?? original.color,
        visibility: original.visibility,
        recurrence: original.recurrence,
        recurrenceEndDate: original.recurrenceEndDate,
        creatorId: original.creatorId,
        organizationId: original.organizationId,
      },
    });

    await tx.eventException.updateMany({
      where: { eventId: original.id, originalStartsAt: { gt: occurrenceStart } },
      data: { eventId: newEvent.id },
    });
    await tx.eventException.deleteMany({
      where: { eventId: original.id, originalStartsAt: occurrenceStart },
    });

    return newEvent;
  });
}

/**
 * "Dieses und alle folgenden" löschen: Serie endet am Tag vor diesem Vorkommen,
 * keine neue Fortsetzung wird erzeugt.
 */
export async function truncateSeriesBefore(
  event: Pick<EventRow, "id" | "recurrence">,
  occurrenceStart: Date,
) {
  const cutoff = previousOccurrence(occurrenceStart, event.recurrence);

  await prisma.$transaction([
    prisma.event.update({
      where: { id: event.id },
      data: { recurrenceEndDate: cutoff },
    }),
    prisma.eventException.deleteMany({
      where: { eventId: event.id, originalStartsAt: { gte: occurrenceStart } },
    }),
  ]);
}

export function isRecurring(recurrence: EventRecurrence): boolean {
  return recurrence !== "NONE";
}
