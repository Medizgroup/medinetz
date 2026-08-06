import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

import type { EventRecurrence } from "@/generated/prisma/client";

export const VALID_RECURRENCE: EventRecurrence[] = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "YEARLY",
];

export type RecurrenceInput = {
  startsAt: Date;
  endsAt: Date;
  recurrence: EventRecurrence;
  recurrenceEndDate: Date | null;
};

export type ExceptionInput = {
  originalStartsAt: Date;
  isCancelled: boolean;
  title: string | null;
  description: string | null;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  allDay: boolean | null;
  color: string | null;
};

export type Occurrence = {
  startsAt: Date;
  endsAt: Date;
  /** Original (unveränderte) Start-Zeit dieses Vorkommens — Schlüssel für Exceptions. */
  originalStartsAt: Date;
  isException: boolean;
  /** Vom Nutzer für genau dieses Vorkommen überschriebene Felder (nur bei isException). */
  titleOverride: string | null;
  descriptionOverride: string | null;
  locationOverride: string | null;
  allDayOverride: boolean | null;
  colorOverride: string | null;
};

/**
 * Expandiert eine Event-Serie zu allen Vorkommen, die in [windowStart, windowEnd] fallen.
 * Für recurrence === NONE wird genau das Original-Intervall zurückgegeben (falls es im Fenster liegt).
 * Exceptions (per-Vorkommen-Overrides/Cancellations) werden auf das jeweils passende
 * Vorkommen angewendet, bevor auf Überlappung mit dem Fenster geprüft wird — so tauchen
 * verschobene Vorkommen auch dann korrekt auf, wenn ihre neue Zeit außerhalb des
 * ursprünglichen Rasters liegt.
 */
export function expandOccurrences(
  input: RecurrenceInput,
  windowStart: Date,
  windowEnd: Date,
  exceptions: ExceptionInput[] = [],
): Occurrence[] {
  const { startsAt, endsAt, recurrence, recurrenceEndDate } = input;
  const durationMs = endsAt.getTime() - startsAt.getTime();

  const exceptionByKey = new Map(
    exceptions.map((e) => [e.originalStartsAt.getTime(), e]),
  );

  // Endgrenze für die Serie: entweder das gesetzte Ende oder das Fenster-Ende (Hard-Limit)
  const seriesEnd = recurrenceEndDate
    ? new Date(recurrenceEndDate.getTime() + 24 * 60 * 60 * 1000) // inklusive Endtag
    : windowEnd;

  // Sicherheitslimit gegen unendliche Schleife
  const HARD_LIMIT = 2000;

  function toOccurrence(
    occStart: Date,
    occEnd: Date,
    originalStart: Date,
    exception: ExceptionInput | undefined,
  ): Occurrence {
    return {
      startsAt: occStart,
      endsAt: occEnd,
      originalStartsAt: originalStart,
      isException: Boolean(exception),
      titleOverride: exception?.title ?? null,
      descriptionOverride: exception?.description ?? null,
      locationOverride: exception?.location ?? null,
      allDayOverride: exception?.allDay ?? null,
      colorOverride: exception?.color ?? null,
    };
  }

  if (recurrence === "NONE") {
    const exception = exceptionByKey.get(startsAt.getTime());
    if (exception?.isCancelled) return [];
    const occStart = exception?.startsAt ?? startsAt;
    const occEnd = exception?.endsAt ?? endsAt;
    return overlaps(occStart, occEnd, windowStart, windowEnd)
      ? [toOccurrence(occStart, occEnd, startsAt, exception)]
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
    const originalStart = new Date(cursor);
    const defaultEnd = new Date(cursor.getTime() + durationMs);
    const exception = exceptionByKey.get(originalStart.getTime());

    if (!exception?.isCancelled) {
      const occStart = exception?.startsAt ?? originalStart;
      const occEnd = exception?.endsAt ?? defaultEnd;

      if (overlaps(occStart, occEnd, windowStart, windowEnd)) {
        occurrences.push(toOccurrence(occStart, occEnd, originalStart, exception));
      }
    }

    cursor = nextOccurrence(cursor, recurrence);
    i++;
  }

  return occurrences;
}

export function nextOccurrence(date: Date, recurrence: EventRecurrence): Date {
  switch (recurrence) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addWeeks(date, 1);
    case "BIWEEKLY":
      return addWeeks(date, 2);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addYears(date, 1);
    default:
      // sollte nie passieren
      return addDays(date, 1);
  }
}

/**
 * Vorkommen unmittelbar vor `date` in derselben Serie (für "diesen und folgende"-Splits:
 * das ist der letzte Tag, an dem die ursprüngliche Serie noch laufen soll).
 */
export function previousOccurrence(
  date: Date,
  recurrence: EventRecurrence,
): Date {
  switch (recurrence) {
    case "DAILY":
      return addDays(date, -1);
    case "WEEKLY":
      return addWeeks(date, -1);
    case "BIWEEKLY":
      return addWeeks(date, -2);
    case "MONTHLY":
      return addMonths(date, -1);
    case "YEARLY":
      return addYears(date, -1);
    default:
      return addDays(date, -1);
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
 * Extrahiert die Serien-ID (und ggf. den Kalendertag des Vorkommens) aus einer Occurrence-ID.
 * `occurrenceDay` ist Mitternacht (lokale Zeit) des Tages, an dem das Vorkommen liegt —
 * die genaue Uhrzeit des Original-Vorkommens muss über `resolveOccurrenceStart`
 * zusammen mit der Serien-Startzeit rekonstruiert werden.
 */
export function parseEventId(id: string): {
  eventId: string;
  isOccurrence: boolean;
  occurrenceDay: Date | null;
} {
  const idx = id.indexOf(":occ:");
  if (idx === -1) return { eventId: id, isOccurrence: false, occurrenceDay: null };
  const dayIso = id.slice(idx + 5);
  const occurrenceDay = new Date(dayIso);
  return { eventId: id.slice(0, idx), isOccurrence: true, occurrenceDay };
}

/**
 * Rekonstruiert die exakte Original-Startzeit eines Vorkommens aus seinem Kalendertag
 * (aus der Occurrence-ID) und der Uhrzeit der Serie (Event.startsAt). Da jede Iteration
 * (Daily/Weekly/Biweekly/Monthly/Yearly) die Uhrzeit der Serie beibehält, kann pro Serie
 * höchstens ein Vorkommen pro Kalendertag existieren — der Tag identifiziert es eindeutig.
 */
export function resolveOccurrenceStart(
  seriesStartsAt: Date,
  occurrenceDay: Date,
): Date {
  const d = new Date(occurrenceDay);
  d.setHours(
    seriesStartsAt.getHours(),
    seriesStartsAt.getMinutes(),
    seriesStartsAt.getSeconds(),
    seriesStartsAt.getMilliseconds(),
  );
  return d;
}
