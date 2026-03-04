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
    description: "Strategic planning for next year",
    end: subDays(new Date(), 23), // 23 days before today
    id: "1",
    location: "Main Conference Hall",
    start: subDays(new Date(), 24), // 24 days before today
    title: "Annual Planning",
  },
  {
    color: "amber",
    description: "Submit final deliverables",
    end: setMinutes(setHours(subDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days before
    id: "2",
    location: "Office",
    start: setMinutes(setHours(subDays(new Date(), 9), 13), 0), // 1:00 PM, 9 days before
    title: "Project Deadline",
  },
  {
    allDay: true,
    color: "orange",
    description: "Strategic planning for next year",
    end: subDays(new Date(), 13), // 13 days before today
    id: "3",
    location: "Main Conference Hall",
    start: subDays(new Date(), 13), // 13 days before today
    title: "Quarterly Budget Review",
  },
  {
    color: "sky",
    description: "Weekly team sync",
    end: setMinutes(setHours(new Date(), 11), 0), // 11:00 AM today
    id: "4",
    location: "Conference Room A",
    start: setMinutes(setHours(new Date(), 10), 0), // 10:00 AM today
    title: "Team Meeting",
  },
  {
    color: "emerald",
    description: "Discuss new project requirements",
    end: setMinutes(setHours(addDays(new Date(), 1), 13), 15), // 1:15 PM, 1 day from now
    id: "5",
    location: "Downtown Cafe",
    start: setMinutes(setHours(addDays(new Date(), 1), 12), 0), // 12:00 PM, 1 day from now
    title: "Lunch with Client",
  },
  {
    allDay: true,
    color: "violet",
    description: "New product release",
    end: addDays(new Date(), 6), // 6 days from now
    id: "6",
    start: addDays(new Date(), 3), // 3 days from now
    title: "Product Launch",
  },
  {
    color: "rose",
    description: "Discuss about new clients",
    end: setMinutes(setHours(addDays(new Date(), 5), 14), 45), // 2:45 PM, 5 days from now
    id: "7",
    location: "Downtown Cafe",
    start: setMinutes(setHours(addDays(new Date(), 4), 14), 30), // 2:30 PM, 4 days from now
    title: "Sales Conference",
  },
  {
    color: "orange",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 10), 30), // 10:30 AM, 5 days from now
    id: "8",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 0), // 9:00 AM, 5 days from now
    title: "Team Meeting",
  },
  {
    color: "sky",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 15), 30), // 3:30 PM, 5 days from now
    id: "9",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 14), 0), // 2:00 PM, 5 days from now
    title: "Review contracts",
  },
  {
    color: "amber",
    description: "Weekly team sync",
    end: setMinutes(setHours(addDays(new Date(), 5), 11), 0), // 11:00 AM, 5 days from now
    id: "10",
    location: "Conference Room A",
    start: setMinutes(setHours(addDays(new Date(), 5), 9), 45), // 9:45 AM, 5 days from now
    title: "Team Meeting",
  },
  {
    color: "emerald",
    description: "Quarterly marketing planning",
    end: setMinutes(setHours(addDays(new Date(), 9), 15), 30), // 3:30 PM, 9 days from now
    id: "11",
    location: "Marketing Department",
    start: setMinutes(setHours(addDays(new Date(), 9), 10), 0), // 10:00 AM, 9 days from now
    title: "Marketing Strategy Session",
  },
  {
    allDay: true,
    color: "sky",
    description: "Presentation of yearly results",
    end: addDays(new Date(), 17), // 17 days from now
    id: "12",
    location: "Grand Conference Center",
    start: addDays(new Date(), 17), // 17 days from now
    title: "Annual Shareholders Meeting",
  },
  {
    color: "rose",
    description: "Brainstorming for new features",
    end: setMinutes(setHours(addDays(new Date(), 27), 17), 0), // 5:00 PM, 27 days from now
    id: "13",
    location: "Innovation Lab",
    start: setMinutes(setHours(addDays(new Date(), 26), 9), 0), // 9:00 AM, 26 days from now
    title: "Product Development Workshop",
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
