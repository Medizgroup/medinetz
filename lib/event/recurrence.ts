import {
  addDays,
  addMonths,
  addWeeks,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

import type { EventRecurrence } from "@/generated/prisma/client";

export type RecurrenceInput = {
  startsAt: Date;
  endsAt: Date;
  recurrence: EventRecurrence;
  recurrenceEndDate: Date | null;
};

export type Occurrence = {
  startsAt: Date;
  endsAt: Date;
};

/**
 * Expandiert eine Event-Serie zu allen Vorkommen, die in [windowStart, windowEnd] fallen.
 * Für recurrence === NONE wird genau das Original-Intervall zurückgegeben (falls es im Fenster liegt).
 */
export function expandOccurrences(
  input: RecurrenceInput,
  windowStart: Date,
  windowEnd: Date,
): Occurrence[] {
  const { startsAt, endsAt, recurrence, recurrenceEndDate } = input;
  const durationMs = endsAt.getTime() - startsAt.getTime();

  // Endgrenze für die Serie: entweder das gesetzte Ende oder das Fenster-Ende (Hard-Limit)
  const seriesEnd = recurrenceEndDate
    ? new Date(recurrenceEndDate.getTime() + 24 * 60 * 60 * 1000) // inklusive Endtag
    : windowEnd;

  // Sicherheitslimit gegen unendliche Schleife
  const HARD_LIMIT = 1000;

  if (recurrence === "NONE") {
    return overlaps(startsAt, endsAt, windowStart, windowEnd)
      ? [{ startsAt, endsAt }]
      : [];
  }

  const occurrences: Occurrence[] = [];
  let cursor = new Date(startsAt);
  let i = 0;

  while (
    i < HARD_LIMIT &&
    !isAfter(cursor, seriesEnd) &&
    !isAfter(cursor, windowEnd)
  ) {
    const occurrenceEnd = new Date(cursor.getTime() + durationMs);

    if (overlaps(cursor, occurrenceEnd, windowStart, windowEnd)) {
      occurrences.push({
        startsAt: new Date(cursor),
        endsAt: occurrenceEnd,
      });
    }

    cursor = nextOccurrence(cursor, recurrence);
    i++;
  }

  return occurrences;
}

function nextOccurrence(date: Date, recurrence: EventRecurrence): Date {
  switch (recurrence) {
    case "WEEKLY":
      return addWeeks(date, 1);
    case "BIWEEKLY":
      return addWeeks(date, 2);
    case "MONTHLY":
      return addMonths(date, 1);
    default:
      // sollte nie passieren
      return addDays(date, 1);
  }
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return !isAfter(aStart, bEnd) && !isBefore(aEnd, bStart);
}

/**
 * Bildet eine deterministische ID für ein virtuelles Vorkommen.
 * Format: <eventId>:occ:<ISO-Date-Tag>
 */
export function buildOccurrenceId(eventId: string, startsAt: Date): string {
  return `${eventId}:occ:${startOfDay(startsAt).toISOString()}`;
}

/**
 * Extrahiert die Serien-ID aus einer Occurrence-ID (oder gibt die ID direkt zurück).
 */
export function parseEventId(id: string): {
  eventId: string;
  isOccurrence: boolean;
} {
  const idx = id.indexOf(":occ:");
  if (idx === -1) return { eventId: id, isOccurrence: false };
  return { eventId: id.slice(0, idx), isOccurrence: true };
}
