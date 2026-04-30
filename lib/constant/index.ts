// cases
export const CASE_STATUS_OPTIONS = [
  { label: "Offen", value: "OPEN", color: "bg-green-500" },
  { label: "In Bearbeitung", value: "IN_PROGRESS", color: "bg-amber-500" },
  { label: "Abgeschlossen", value: "CLOSED", color: "bg-blue-500" },
  { label: "Wartend", value: "WAITING", color: "bg-muted-foreground/40" },
];

export const PRIORITY_VALUES = [
  { label: "Niedrig", value: "LOW", variant: "info" as const },
  { label: "Mittel", value: "MEDIUM", variant: "warning" as const },
  { label: "Hoch", value: "HIGH", variant: "error" as const },
  { label: "Dringend", value: "URGENT", variant: "destructive" as const },
];
