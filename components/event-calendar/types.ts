export type CalendarView = "month" | "week" | "day" | "agenda";

export type EventRecurrence = "NONE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type EventVisibility = "PUBLIC" | "ORGANIZATION" | "PRIVATE";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  location?: string;
  // Neu:
  recurrence?: EventRecurrence;
  recurrenceEndDate?: Date | string | null;
  visibility?: EventVisibility;
  organizationId?: string | null;
}

export type EventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange";
