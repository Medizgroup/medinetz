import { isToday, isYesterday, format } from "date-fns";
import { de } from "date-fns/locale";

export type WithDate = { createdAt: string | Date };

export function groupByDay<T extends WithDate>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  const map = new Map<string, T[]>();

  for (const item of items) {
    const d = new Date(item.createdAt);
    let label: string;
    if (isToday(d)) {
      label = "Heute";
    } else if (isYesterday(d)) {
      label = "Gestern";
    } else {
      label = format(d, "EEEE, d. MMMM yyyy", { locale: de });
    }
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }

  for (const [label, items] of map) {
    groups.push({ label, items });
  }

  return groups;
}
