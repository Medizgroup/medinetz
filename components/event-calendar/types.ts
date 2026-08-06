export type CalendarView = "month" | "week" | "day" | "agenda";

export type EventRecurrence =
  | "NONE"
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "YEARLY";
export type EventVisibility = "PUBLIC" | "ORGANIZATION" | "PRIVATE";

/**
 * Bearbeitungs-/Löschbereich für ein Vorkommen einer wiederkehrenden Serie:
 * - "single": nur dieses eine Vorkommen (Exception)
 * - "following": dieses und alle folgenden Vorkommen (Serie wird gesplittet)
 * - "all": die ganze Serie
 * Bei nicht-wiederkehrenden Events ohne Bedeutung (wird als "all" behandelt).
 */
export type EditScope = "single" | "following" | "all";

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
