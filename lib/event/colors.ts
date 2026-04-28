import type { EventColor as PrismaEventColor } from "@/generated/prisma/client";
import type { EventColor as UIEventColor } from "@/components/event-calendar/types";

const TO_UI: Record<PrismaEventColor, UIEventColor> = {
  SKY: "sky",
  AMBER: "amber",
  VIOLET: "violet",
  ROSE: "rose",
  EMERALD: "emerald",
  ORANGE: "orange",
};

const TO_DB: Record<UIEventColor, PrismaEventColor> = {
  sky: "SKY",
  amber: "AMBER",
  violet: "VIOLET",
  rose: "ROSE",
  emerald: "EMERALD",
  orange: "ORANGE",
};

export function colorToUI(color: PrismaEventColor): UIEventColor {
  return TO_UI[color];
}

export function colorToDb(color: UIEventColor | string): PrismaEventColor {
  if (color in TO_DB) return TO_DB[color as UIEventColor];
  return "SKY";
}
