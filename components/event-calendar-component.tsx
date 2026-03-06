"use client";

import { addDays, setHours, setMinutes, subDays } from "date-fns";
import { useState } from "react";

import {
  type CalendarEvent,
  EventCalendar,
} from "@/components/event-calendar/event-calendar";

// Sample events data with hardcoded times
const sampleEvents: CalendarEvent[] = [
  {
    allDay: true,
    color: "sky",
    description: "Strategische Planung für das nächste Jahr",
    end: subDays(new Date(), 23), // vor 23 Tagen
    id: "1",
    location: "Hauptkonferenzraum",
    start: subDays(new Date(), 24), // vor 24 Tagen
    title: "Jahresplanung",
  },
  {
    color: "amber",
    description: "Abgabe der finalen Ergebnisse",
    end: setMinutes(setHours(subDays(new Date(), 9), 15), 30), // 15:30 Uhr, vor 9 Tagen
    id: "2",
    location: "Büro",
    start: setMinutes(setHours(subDays(new Date(), 9), 13), 0), // 13:00 Uhr, vor 9 Tagen
    title: "Projekt-Abgabefrist",
  },
  {
    allDay: true,
    color: "orange",
    description: "Strategische Planung für das nächste Jahr",
    end: subDays(new Date(), 13), // vor 13 Tagen
    id: "3",
    location: "Hauptkonferenzraum",
    start: subDays(new Date(), 13), // vor 13 Tagen
    title: "Quartalsbudgetbesprechung",
  },
  {
    color: "sky",
    description: "Wöchentliches Team-Meeting",
    end: setMinutes(setHours(new Date(), 11), 0), // 11:00 Uhr heute
    id: "4",
    location: "Konferenzraum A",
    start: setMinutes(setHours(new Date(), 10), 0), // 10:00 Uhr heute
    title: "Team-Meeting",
  },
  {
    color: "emerald",
    description: "Besprechung neuer Projektanforderungen",
    end: setMinutes(setHours(addDays(new Date(), 1), 13), 15), // 13:15 Uhr, in 1 Tag
    id: "5",
    location: "Innenstadt Café",
    start: setMinutes(setHours(addDays(new Date(), 1), 12), 0), // 12:00 Uhr, in 1 Tag
    title: "Mittagessen mit Kunde",
  },
  {
    allDay: true,
    color: "violet",
    description: "Produktneuheit Veröffentlichung",
    end: addDays(new Date(), 6), // in 6 Tagen
    id: "6",
    start: addDays(new Date(), 3), // in 3 Tagen
    title: "Produkt-Launch",
  },
  {
    color: "rose",
    description: "Besprechung über neue Kunden",
    end: setMinutes(setHours(addDays(new Date(), 5), 14), 45), // 14:45 Uhr, in 5 Tagen
    id: "7",
    location: "Innenstadt Café",
    start: setMinutes(setHours(addDays(new Date(), 4), 14), 30), // 14:30 Uhr, in 4 Tagen
    title: "Vertriebskonferenz",
  },
  {
    color: "orange",
    description: "Wöchentliches Team-Meeting",
    end: setMinutes(setHours(addDays(new Date(), 5), 10), 30), // 10:30 Uhr, in 5 Tagen
    id: "8",
    location: "Konferenzraum A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 0), // 9:00 Uhr, in 5 Tagen
    title: "Team-Meeting",
  },
  {
    color: "sky",
    description: "Wöchentliches Team-Meeting",
    end: setMinutes(setHours(addDays(new Date(), 5), 15), 30), // 15:30 Uhr, in 5 Tagen
    id: "9",
    location: "Konferenzraum A",
    start: setMinutes(setHours(addDays(new Date(), 5), 14), 0), // 14:00 Uhr, in 5 Tagen
    title: "Vertragsprüfung",
  },
  {
    color: "amber",
    description: "Wöchentliches Team-Meeting",
    end: setMinutes(setHours(addDays(new Date(), 5), 11), 0), // 11:00 Uhr, in 5 Tagen
    id: "10",
    location: "Konferenzraum A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 45), // 9:45 Uhr, in 5 Tagen
    title: "Team-Meeting",
  },
  {
    color: "emerald",
    description: "Quartalsweise Marketing-Planung",
    end: setMinutes(setHours(addDays(new Date(), 9), 15), 30), // 15:30 Uhr, in 9 Tagen
    id: "11",
    location: "Marketing Abteilung",
    start: setMinutes(setHours(addDays(new Date(), 9), 10), 0), // 10:00 Uhr, in 9 Tagen
    title: "Marketing-Strategie-Sitzung",
  },
  {
    allDay: true,
    color: "sky",
    description: "Präsentation der Jahresergebnisse",
    end: addDays(new Date(), 17), // in 17 Tagen
    id: "12",
    location: "Grand Konferenzzentrum",
    start: addDays(new Date(), 17), // in 17 Tagen
    title: "Jährliche Hauptversammlung",
  },
  {
    color: "rose",
    description: "Ideenfindung für neue Funktionen",
    end: setMinutes(setHours(addDays(new Date(), 27), 17), 0), // 17:00 Uhr, in 27 Tagen
    id: "13",
    location: "Innovationslabor",
    start: setMinutes(setHours(addDays(new Date(), 26), 9), 0), // 9:00 Uhr, in 26 Tagen
    title: "Produktentwicklungs-Workshop",
  },
];

export default function EventCalendarComponent() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <EventCalendar
      events={events}
      onEventAdd={handleEventAdd}
      onEventDelete={handleEventDelete}
      onEventUpdate={handleEventUpdate}
    />
  );
}
