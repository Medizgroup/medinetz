"use client";

import { useTheme } from "next-themes";
import { ActivityCalendar, type ThemeInput } from "react-activity-calendar";

export type CalendarDay = {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const orangeTheme = {
  light: ["#f5f5f5", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e40af"],
  dark: ["#262626", "#172554", "#1e40af", "#2563eb", "#60a5fa"],
} satisfies ThemeInput;

export default function UserActivityCalendar({
  data,
}: {
  data: CalendarDay[];
}) {
  const { theme } = useTheme();
  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={data}
        theme={orangeTheme}
        maxLevel={4}
        blockRadius={10}
        blockSize={16}
        colorScheme={theme === "dark" ? "dark" : "light"}
        labels={{
          totalCount: "{{count}} Aktivitäten in den letzten 12 Monaten",
        }}
        tooltips={{
          activity: {
            text: (activity) =>
              `${activity.level} Aktivität(en) am ${activity.date}`,
          },
          colorLegend: {
            text: (level) => `Aktivitätsstufe ${level + 1}`,
          },
        }}
      />
    </div>
  );
}
