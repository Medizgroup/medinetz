import { Flag } from "lucide-react";

export const PRIORITY_LABEL: Record<number, string> = {
  1: "Niedrig",
  2: "Mittel",
  3: "Hoch",
};

export function priorityColorClass(priority: number) {
  switch (priority) {
    case 3:
      return "text-red-500";
    case 2:
      return "text-amber-500";
    case 1:
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function priorityBgClass(priority: number) {
  switch (priority) {
    case 3:
      return "bg-red-500";
    case 2:
      return "bg-amber-500";
    case 1:
      return "bg-muted-foreground/40";
    default:
      return "bg-muted";
  }
}

export { Flag };
