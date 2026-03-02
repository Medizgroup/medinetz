"use client";

import { ActivityCalendar, type ThemeInput } from "react-activity-calendar";

export type CalendarDay = {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const orangeTheme = {
  light: ["#fafafa", "#d4d4d4", "#a3a3a3", "#737373", "#0a0a0a"],
  dark: ["#161b22", "#7c2d12", "#9a3412", "#c2410c", "#f97316"],
} satisfies ThemeInput;

export default function UserActivityCalendar({
  data,
}: {
  data: CalendarDay[];
}) {
  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={data}
        theme={orangeTheme}
        maxLevel={4}
        blockRadius={10}
        blockSize={15}
        colorScheme="light"
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
