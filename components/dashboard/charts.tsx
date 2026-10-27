"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { XAxis } from "@/components/charts/x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from "@/components/charts/legend";

// Status-Farben wie in der Fall-Liste (statusColorClass)
const CASE_SERIES = [
  { key: "open", label: "Offen", color: "#10b981" },
  { key: "in_progress", label: "In Bearbeitung", color: "#f59e0b" },
  { key: "waiting", label: "Wartend", color: "#94a3b8" },
  { key: "closed", label: "Abgeschlossen", color: "#0ea5e9" },
] as const;

const FINANCE_SERIES = [
  { key: "donations", label: "Spenden", color: "#10b981" },
  { key: "expenses", label: "Ausgaben", color: "#f43f5e" },
] as const;

const PIE_COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function ChartCard({
  title,
  children,
  legend,
}: {
  title: string;
  children: React.ReactNode;
  legend?: React.ReactNode;
}) {
  return (
    <Card className="bg-transparent">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {legend}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SeriesLegend({
  series,
}: {
  series: readonly { key: string; label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
      Keine Daten im gewählten Zeitraum.
    </div>
  );
}

export function CasesPerMonthChart({
  data,
}: {
  data: {
    month: string;
    open: number;
    in_progress: number;
    waiting: number;
    closed: number;
    total: number;
  }[];
}) {
  const hasData = data.some((d) => d.total > 0);

  return (
    <ChartCard
      title="Fälle pro Monat"
      legend={<SeriesLegend series={CASE_SERIES} />}>
      {hasData ? (
        <BarChart data={data} xDataKey="month" aspectRatio="2 / 1">
          <Grid horizontal />
          {CASE_SERIES.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={s.color} lineCap="round" />
          ))}
          <BarXAxis maxLabels={6} />
          <ChartTooltip
            rows={(point) =>
              CASE_SERIES.map((s) => ({
                color: s.color,
                label: s.label,
                value: Number(point[s.key] ?? 0),
              }))
            }
          />
        </BarChart>
      ) : (
        <Empty />
      )}
    </ChartCard>
  );
}

export function FinancePerMonthChart({
  data,
}: {
  data: { month: string; date: Date; donations: number; expenses: number }[];
}) {
  const hasData = data.some((d) => d.donations > 0 || d.expenses > 0);
  const labels = data.map((d) => d.month);

  return (
    <ChartCard
      title="Spenden vs. Ausgaben"
      legend={<SeriesLegend series={FINANCE_SERIES} />}>
      {hasData ? (
        <AreaChart data={data} xDataKey="date" aspectRatio="2 / 1">
          <Grid horizontal />
          {FINANCE_SERIES.map((s) => (
            <Area key={s.key} dataKey={s.key} fill={s.color} fillOpacity={0.3} />
          ))}
          <XAxis labels={labels} numTicks={6} />
          <ChartTooltip
            dateLabels={labels}
            rows={(point) =>
              FINANCE_SERIES.map((s) => ({
                color: s.color,
                label: s.label,
                value: eur.format(Number(point[s.key] ?? 0)),
              }))
            }
          />
        </AreaChart>
      ) : (
        <Empty />
      )}
    </ChartCard>
  );
}

export function DistributionPie({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const slices = data.map((d, i) => ({
    label: d.name,
    value: d.value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <ChartCard title={title}>
      {slices.length === 0 ? (
        <Empty />
      ) : (
        <div className="flex flex-col items-center gap-5">
          <PieChart
            data={slices}
            size={200}
            innerRadius={62}
            padAngle={0.03}
            cornerRadius={4}
            hoveredIndex={hovered}
            onHoverChange={setHovered}>
            {slices.map((_, i) => (
              <PieSlice key={i} index={i} />
            ))}
            <PieCenter defaultLabel="Gesamt" />
          </PieChart>
          <Legend
            items={slices}
            hoveredIndex={hovered}
            onHoverChange={setHovered}
            className="w-full">
            <LegendItem className="flex items-center gap-2 text-sm">
              <LegendMarker />
              <LegendLabel className="flex-1 truncate" />
              <LegendValue showPercentage />
            </LegendItem>
          </Legend>
        </div>
      )}
    </ChartCard>
  );
}
