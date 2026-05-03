"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

const COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

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
  const chartConfig = {
    open: {
      label: "Offen",
      color: "var(--chart-1)",
    },
    in_progress: {
      label: "In Bearbeitung",
      color: "var(--chart-2)",
    },
    waiting: {
      label: "Wartend",
      color: "var(--chart-3)",
    },
    closed: {
      label: "Abgeschlossen",
      color: "var(--chart-4)",
    },
  } satisfies ChartConfig;
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle className="text-base">Fälle pro Monat</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ChartContainer config={chartConfig}>
          <BarChart data={data} accessibilityLayer>
            {/* <CartesianGrid /> */}
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />

            <CartesianGrid vertical={false} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="open"
              stackId="s"
              fill="#10b981"
              name="Offen"
              radius={8}
            />
            <Bar
              dataKey="in_progress"
              stackId="s"
              fill="#f59e0b"
              name="In Bearbeitung"
              radius={8}
            />
            <Bar
              dataKey="waiting"
              stackId="s"
              fill="#94a3b8"
              name="Wartend"
              radius={8}
            />
            <Bar
              dataKey="closed"
              stackId="s"
              fill="#0ea5e9"
              name="Abgeschlossen"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function FinancePerMonthChart({
  data,
}: {
  data: { month: string; donations: number; expenses: number }[];
}) {
  const chartConfig = {
    donations: {
      label: "Spenden",
      color: "#10b981",
    },
    expenses: {
      label: "Ausgaben",
      color: "#f43f5e",
    },
  } satisfies ChartConfig;
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle className="text-base">Spenden vs. Ausgaben</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 20, right: 2, bottom: 0, left: 2 }}>
            <defs>
              <linearGradient id="chart16-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-donations)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0}
                />
              </linearGradient>
              <filter
                id="chart16-dot-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter
                id="chart16-line-glow"
                x="-10%"
                y="-20%"
                width="120%"
                height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-36 gap-2.5"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
                          style={
                            {
                              "--color-bg": `var(--color-${name})`,
                            } as React.CSSProperties
                          }
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label || name}
                        </span>
                      </div>
                      <span className="text-foreground font-semibold tabular-nums">
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="donations"
              type="natural"
              fill="rgba(16, 185, 129, 0.05)"
              stroke="var(--color-donations)"
              strokeWidth={2}
              filter="url(#chart16-line-glow)"
              dot={{
                r: 4,
                fill: "var(--color-donations)",
                strokeWidth: 2,
                stroke: "var(--background)",
                filter: "url(#chart16-dot-glow)",
              }}
              activeDot={{ r: 6, strokeWidth: 3, stroke: "var(--background)" }}
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="rgba(244, 63, 94, 0.05)"
              stroke="var(--color-expenses)"
              strokeWidth={2}
              filter="url(#chart16-line-glow)"
              dot={{
                r: 4,
                fill: "var(--color-expenses)",
                strokeWidth: 2,
                stroke: "var(--background)",
                filter: "url(#chart16-dot-glow)",
              }}
              activeDot={{ r: 6, strokeWidth: 3, stroke: "var(--background)" }}
            />
          </AreaChart>
          {/* <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
              formatter={(v: number) =>
                v.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="donations"
              stroke="#10b981"
              strokeWidth={2}
              name="Spenden"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              name="Ausgaben"
              dot={false}
            />
          </LineChart> */}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ResidenceDonut({
  data,
}: {
  data: { name: string; value: number; key: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  const chartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.key,
      {
        label: d.name,
        color: COLORS[i],
      },
    ]),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aufenthaltsstatus</CardTitle>
      </CardHeader>
      <CardContent className="">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Keine Daten.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]">
            <PieChart accessibilityLayer>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                cornerRadius={5}
                paddingAngle={3}
                strokeWidth={3}
                stroke="var(--background)">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>

              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TopBars({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number }[];
}) {
  const chartConfig = data.reduce<
    Record<string, { label: string; color: string }>
  >((acc, d) => {
    acc[d.name] = {
      label: d.name,
      color: COLORS[Object.keys(acc).length % COLORS.length],
    };
    return acc;
  }, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Keine Daten.
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                left: -20,
              }}
              accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" dataKey="value" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#0ea5e9" radius={10} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
