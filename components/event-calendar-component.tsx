/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { toast } from "sonner";

import { EventCalendar } from "@/components/event-calendar/event-calendar";
import type { CalendarEvent } from "@/components/event-calendar/types";
import { parseEventId } from "@/lib/event/recurrence";
import { Loading } from "./loading-component";

type Org = { id: string; name: string };

export default function EventCalendarComponent({
  initialOrgs = [],
}: {
  initialOrgs?: Org[];
}) {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/events");
      if (!r.ok) throw new Error();
      const data: CalendarEvent[] = await r.json();
      // Server-Datums kommen als ISO-Strings → Date-Objekte
      setEvents(
        data.map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        })),
      );
    } catch {
      toast.error("Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function handleAdd(e: CalendarEvent) {
    const r = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: e.title,
        description: e.description,
        location: e.location,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        color: e.color,
        recurrence: e.recurrence ?? "NONE",
        recurrenceEndDate: e.recurrenceEndDate ?? null,
        visibility: e.visibility ?? "ORGANIZATION",
        organizationId: e.organizationId ?? null,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => null);
      toast.error(err?.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    await reload();
  }

  async function handleUpdate(e: CalendarEvent) {
    const { eventId } = parseEventId(e.id);
    const r = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: e.title,
        description: e.description,
        location: e.location,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        color: e.color,
        recurrence: e.recurrence,
        recurrenceEndDate: e.recurrenceEndDate ?? null,
        visibility: e.visibility,
      }),
    });

    if (!r.ok) {
      const err = await r.json().catch(() => null);
      toast.error(err?.error ?? "Aktualisierung fehlgeschlagen.");
      return;
    }
    await reload();
  }

  async function handleDelete(id: string) {
    const { eventId } = parseEventId(id);
    const r = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

    if (!r.ok) {
      toast.error("Löschen fehlgeschlagen.");
      return;
    }
    await reload();
  }

  return (
    <div className="px-2 py-4">
      {loading && events.length === 0 ? <Loading /> : null}
      <EventCalendar
        events={events}
        onEventAdd={handleAdd}
        onEventUpdate={handleUpdate}
        onEventDelete={handleDelete}
        availableOrgs={initialOrgs}
      />
    </div>
  );
}
