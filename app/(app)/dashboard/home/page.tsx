import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  getCasesPerMonth,
  getDiagnosisDistribution,
  getFinancePerMonth,
  getKpis,
  getLanguageDistribution,
  getResidenceDistribution,
  getUpcomingEvents,
  type StatsRange,
} from "@/lib/utils/dashboard/stats";

import DashboardFilters from "@/components/dashboard/dashboard-filters";
import KpiCards from "@/components/dashboard/kpi-cards";
import {
  CasesPerMonthChart,
  FinancePerMonthChart,
  ResidenceDonut,
  TopBars,
} from "@/components/dashboard/charts";
import {
  ResourcesCard,
  UpcomingEventsCard,
} from "@/components/dashboard/sidebar-cards";

const VALID_RANGES: StatsRange[] = ["year", "12m", "lifetime", "custom"];

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const sp = await searchParams;
  const orgParam = sp.org ?? "all";
  const rangeParam = (sp.range as StatsRange) ?? "year";
  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "year";
  const customFrom = sp.from ?? "";
  const customTo = sp.to ?? "";

  // Memberships
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: { organization: { name: "asc" } },
  });

  const orgs = memberships.map((m) => m.organization);
  const allowedOrgIds = orgs.map((o) => o.id);

  if (allowedOrgIds.length === 0) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-semibold">Übersicht</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du bist aktuell keiner Organisation zugeordnet.
        </p>
      </div>
    );
  }

  const orgIds =
    orgParam === "all" || !allowedOrgIds.includes(orgParam)
      ? allowedOrgIds
      : [orgParam];

  const params = {
    orgIds,
    range,
    customFrom: customFrom ? new Date(customFrom) : null,
    customTo: customTo ? new Date(customTo) : null,
  };

  const [
    kpis,
    casesPerMonth,
    financePerMonth,
    residence,
    languages,
    diagnoses,
    upcomingEvents,
  ] = await Promise.all([
    getKpis(params),
    getCasesPerMonth(params),
    getFinancePerMonth(params),
    getResidenceDistribution(params),
    getLanguageDistribution(params),
    getDiagnosisDistribution(params),
    getUpcomingEvents({ orgIds, userId: session.user.id }),
  ]);

  return (
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Übersicht</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Statistiken und Charts deiner Organisationen.
          </p>
        </div>
      </div>

      <DashboardFilters
        orgs={orgs}
        currentOrgId={orgParam}
        currentRange={range}
        customFrom={customFrom}
        customTo={customTo}
      />

      <KpiCards kpis={kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CasesPerMonthChart data={casesPerMonth} />
        <FinancePerMonthChart data={financePerMonth} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ResidenceDonut data={residence} />
        <TopBars title="Top Sprachen" data={languages} />
        <TopBars title="Top Diagnosen" data={diagnoses} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ResourcesCard
          doctors={kpis.resources.activeDoctors}
          interpreters={kpis.resources.activeInterpreters}
        />
        <UpcomingEventsCard events={upcomingEvents} />
      </div>
    </div>
  );
}
