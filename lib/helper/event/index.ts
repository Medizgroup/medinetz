export function recurrenceText(rec: string | null | undefined): string | null {
  switch (rec) {
    case "DAILY":
      return "täglicher";
    case "WEEKLY":
      return "wöchentlicher";
    case "BIWEEKLY":
      return "zweiwöchentlicher";
    case "MONTHLY":
      return "monatlicher";
    case "YEARLY":
      return "jährlicher";
    default:
      return null;
  }
}

export function formatEventDate(startsAt: Date, rec: string): string {
  // Formatieren in deutscher Locale: "Di, 28. Apr 2026, 20:00"
  const fmt = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formatted = fmt.format(startsAt);

  if (rec === "DAILY") return `Ab ${formatted} · jeden Tag`;
  if (rec === "WEEKLY") return `Ab ${formatted} · jede Woche`;
  if (rec === "BIWEEKLY") return `Ab ${formatted} · alle 2 Wochen`;
  if (rec === "MONTHLY") return `Ab ${formatted} · jeden Monat`;
  if (rec === "YEARLY") return `Ab ${formatted} · jedes Jahr`;

  return formatted;
}
