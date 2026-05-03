import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function calcChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? null : { pct: 100, positive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.abs(pct), positive: pct >= 0 };
}

function ChangeBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const change = calcChange(current, previous);
  if (change === null) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium inline-flex items-center px-1.5 ps-2.5 py-0.5 text-xs",
        change.positive
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      )}>
      {change.positive ? (
        <TrendingUp className="mr-0.5 -ml-1 h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="mr-0.5 -ml-1 h-4 w-4 text-red-500" />
      )}
      {change.pct.toFixed(1)}%
    </Badge>
  );
}

type Kpis = {
  cases: { open: number; total: number; thisMonth: number; lastMonth: number };
  patients: { total: number; thisMonth: number; lastMonth: number };
  finance: {
    totalDonations: number;
    totalExpenses: number;
    available: number;
    donationsThisMonth: number;
    donationsLastMonth: number;
  };
  resources: { activeDoctors: number; activeInterpreters: number };
};

export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const items = [
    {
      label: "Patienten",
      value: kpis.patients.total.toLocaleString("de-DE"),
      sublabel: "im Zeitraum",
      change: (
        <ChangeBadge
          current={kpis.patients.thisMonth}
          previous={kpis.patients.lastMonth}
        />
      ),
    },
    {
      label: "Fälle",
      value: kpis.cases.total.toLocaleString("de-DE"),
      sublabel: `davon ${kpis.cases.open} offen`,
      change: (
        <ChangeBadge
          current={kpis.cases.thisMonth}
          previous={kpis.cases.lastMonth}
        />
      ),
    },
    {
      label: "Spenden",
      value: kpis.finance.totalDonations.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
      sublabel: `verfügbar: ${kpis.finance.available.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      })}`,
      change: (
        <ChangeBadge
          current={kpis.finance.donationsThisMonth}
          previous={kpis.finance.donationsLastMonth}
        />
      ),
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <Card key={i} className="p-6 py-4 shadow-2xs">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                {item.label}
              </dt>
              {item.change}
            </div>
            <dd className="tabular-nums text-3xl font-semibold text-foreground mt-2">
              {item.value}
            </dd>
            <p className="text-xs text-muted-foreground mt-1">
              {item.sublabel}
            </p>
          </CardContent>
        </Card>
      ))}
    </dl>
  );
}
