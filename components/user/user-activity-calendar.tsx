"use client";

import { ActivityCalendar, type ThemeInput } from "react-activity-calendar";

export type CalendarDay = {
  date: string; // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const orangeTheme = {
  light: ["#fff", "#f3f7e0", "#d9ef74", "#a6cf45", "#486c1c"],
  dark: ["#18181b", "#27472f", "#5aa152", "#89e07c", "#e6ffea"],
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
