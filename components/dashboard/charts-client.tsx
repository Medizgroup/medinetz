"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

// Charts messen ihren Container und zeichnen erst im Browser — Server-Rendering
// bringt nichts und führte im Production-Build zu Hydration-Abweichungen.
const placeholder = () => <Skeleton className="h-72 w-full rounded-xl" />;

export const CasesPerMonthChart = dynamic(
  () => import("./charts").then((m) => m.CasesPerMonthChart),
  { ssr: false, loading: placeholder },
);
export const FinancePerMonthChart = dynamic(
  () => import("./charts").then((m) => m.FinancePerMonthChart),
  { ssr: false, loading: placeholder },
);
export const DistributionPie = dynamic(
  () => import("./charts").then((m) => m.DistributionPie),
  { ssr: false, loading: placeholder },
);
