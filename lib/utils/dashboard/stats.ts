import prisma from "@/lib/prisma";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  format,
} from "date-fns";

export type StatsRange = "year" | "12m" | "lifetime" | "custom";

export type StatsParams = {
  orgIds: string[]; // welche Orgs einbeziehen
  range: StatsRange;
  customFrom?: Date | null;
  customTo?: Date | null;
};

function resolveRange(params: StatsParams): {
  from: Date | null;
  to: Date | null;
} {
  const now = new Date();
  switch (params.range) {
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "12m":
      return { from: startOfMonth(subMonths(now, 11)), to: now };
    case "lifetime":
      return { from: null, to: null };
    case "custom":
      return {
        from: params.customFrom ?? null,
        to: params.customTo ?? null,
      };
  }
}

function dateFilter(from: Date | null, to: Date | null) {
  if (!from && !to) return undefined;
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;
  return filter;
}

export async function getKpis(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);
  const dateBetween = dateFilter(from, to);

  const now = new Date();
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisMonthStart = startOfMonth(now);

  // Cases
  const [openCases, totalCases, casesThisMonth, casesLastMonth] =
    await Promise.all([
      prisma.case.count({
        where: {
          organizationId: { in: orgIds },
          status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
        },
      }),
      prisma.case.count({
        where: {
          organizationId: { in: orgIds },
          ...(dateBetween ? { createdAt: dateBetween } : {}),
        },
      }),
      prisma.case.count({
        where: {
          organizationId: { in: orgIds },
          createdAt: { gte: thisMonthStart, lte: now },
        },
      }),
      prisma.case.count({
        where: {
          organizationId: { in: orgIds },
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
    ]);

  // Patienten (über Cases verbunden)
  const patientsRaw = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      ...(dateBetween ? { createdAt: dateBetween } : {}),
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  const totalPatients = patientsRaw.length;

  const patientsThisMonthRaw = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      createdAt: { gte: thisMonthStart, lte: now },
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  const patientsThisMonth = patientsThisMonthRaw.length;

  const patientsLastMonthRaw = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  const patientsLastMonth = patientsLastMonthRaw.length;

  // Donations & Expenses
  const [donationsAgg, expensesAgg, donationsThisMonth, donationsLastMonth] =
    await Promise.all([
      prisma.donation.aggregate({
        where: {
          OR: [{ organizationId: { in: orgIds } }, { organizationId: null }],
          ...(dateBetween ? { donationDate: dateBetween } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          organizationId: { in: orgIds },
          ...(dateBetween ? { expenseDate: dateBetween } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: {
          OR: [{ organizationId: { in: orgIds } }, { organizationId: null }],
          donationDate: { gte: thisMonthStart, lte: now },
        },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: {
          OR: [{ organizationId: { in: orgIds } }, { organizationId: null }],
          donationDate: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

  const totalDonations = Number(donationsAgg._sum.amount ?? 0);
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
  const donationsThisMonthVal = Number(donationsThisMonth._sum.amount ?? 0);
  const donationsLastMonthVal = Number(donationsLastMonth._sum.amount ?? 0);

  // Aktive Ressourcen (instanz-weit)
  const [activeDoctors, activeInterpreters] = await Promise.all([
    prisma.doctor.count({ where: { isActive: true } }),
    prisma.interpreter.count({ where: { isActive: true } }),
  ]);

  return {
    cases: {
      open: openCases,
      total: totalCases,
      thisMonth: casesThisMonth,
      lastMonth: casesLastMonth,
    },
    patients: {
      total: totalPatients,
      thisMonth: patientsThisMonth,
      lastMonth: patientsLastMonth,
    },
    finance: {
      totalDonations,
      totalExpenses,
      available: totalDonations - totalExpenses,
      donationsThisMonth: donationsThisMonthVal,
      donationsLastMonth: donationsLastMonthVal,
    },
    resources: {
      activeDoctors,
      activeInterpreters,
    },
  };
}

// === Cases pro Monat (Bar, gestapelt nach Status) ===
export async function getCasesPerMonth(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);

  // Default: letzte 12 Monate wenn nichts gesetzt
  const now = new Date();
  const rangeFrom = from ?? startOfMonth(subMonths(now, 11));
  const rangeTo = to ?? now;

  const cases = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      createdAt: { gte: rangeFrom, lte: rangeTo },
    },
    select: { createdAt: true, status: true },
  });

  // Buckets aufbauen
  const months: { key: string; label: string; date: Date }[] = [];
  let cursor = startOfMonth(rangeFrom);
  while (cursor <= rangeTo) {
    months.push({
      key: format(cursor, "yyyy-MM"),
      label: format(cursor, "MMM yy"),
      date: new Date(cursor),
    });
    cursor = startOfMonth(subMonths(cursor, -1));
  }

  const byMonth = new Map<
    string,
    { open: number; in_progress: number; waiting: number; closed: number }
  >();
  for (const m of months) {
    byMonth.set(m.key, { open: 0, in_progress: 0, waiting: 0, closed: 0 });
  }

  for (const c of cases) {
    const key = format(c.createdAt, "yyyy-MM");
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    if (c.status === "OPEN") bucket.open++;
    else if (c.status === "IN_PROGRESS") bucket.in_progress++;
    else if (c.status === "WAITING") bucket.waiting++;
    else if (c.status === "CLOSED") bucket.closed++;
  }

  return months.map((m) => {
    const b = byMonth.get(m.key)!;
    return {
      month: m.label,
      ...b,
      total: b.open + b.in_progress + b.waiting + b.closed,
    };
  });
}

// === Spenden vs. Ausgaben pro Monat (Lines) ===
export async function getFinancePerMonth(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);

  const now = new Date();
  const rangeFrom = from ?? startOfMonth(subMonths(now, 11));
  const rangeTo = to ?? now;

  const [donations, expenses] = await Promise.all([
    prisma.donation.findMany({
      where: {
        OR: [{ organizationId: { in: orgIds } }, { organizationId: null }],
        donationDate: { gte: rangeFrom, lte: rangeTo },
      },
      select: { donationDate: true, amount: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: { in: orgIds },
        expenseDate: { gte: rangeFrom, lte: rangeTo },
      },
      select: { expenseDate: true, amount: true },
    }),
  ]);

  const months: { key: string; label: string; date: Date }[] = [];
  let cursor = startOfMonth(rangeFrom);
  while (cursor <= rangeTo) {
    months.push({
      key: format(cursor, "yyyy-MM"),
      label: format(cursor, "MMM yy"),
      date: new Date(cursor),
    });
    cursor = startOfMonth(subMonths(cursor, -1));
  }

  const byMonth = new Map<string, { donations: number; expenses: number }>();
  for (const m of months) {
    byMonth.set(m.key, { donations: 0, expenses: 0 });
  }

  for (const d of donations) {
    const key = format(d.donationDate, "yyyy-MM");
    const b = byMonth.get(key);
    if (b) b.donations += Number(d.amount);
  }
  for (const e of expenses) {
    const key = format(e.expenseDate, "yyyy-MM");
    const b = byMonth.get(key);
    if (b) b.expenses += Number(e.amount);
  }

  return months.map((m) => {
    const b = byMonth.get(m.key)!;
    return { month: m.label, ...b };
  });
}

// === Verteilung Aufenthaltsstatus (Donut) ===
export async function getResidenceDistribution(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);

  // Patienten via ihrer Cases finden, die in den orgIds + Zeitraum liegen
  const cases = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });

  const patientIds = cases.map((c) => c.patientId);
  if (patientIds.length === 0) return [];

  const grouped = await prisma.patient.groupBy({
    by: ["residenceStatus"],
    where: { id: { in: patientIds }, deletedAt: null },
    _count: { _all: true },
  });

  const labels: Record<string, string> = {
    UNDOCUMENTED: "Ohne Papiere",
    ASYLUM_PROCESS: "Im Asylverfahren",
    TOLERATED: "Geduldet",
    RECOGNIZED: "Anerkannt",
    EU_CITIZEN_NO_INSURANCE: "EU ohne KV",
    OTHER: "Sonstige",
  };

  return grouped.map((g) => ({
    name: labels[g.residenceStatus] ?? g.residenceStatus,
    value: g._count._all,
    key: g.residenceStatus,
  }));
}

// === Top-Sprachen ===
export async function getLanguageDistribution(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);

  const cases = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });

  const patientIds = cases.map((c) => c.patientId);
  if (patientIds.length === 0) return [];

  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds }, deletedAt: null },
    select: { primaryLanguage: true },
  });

  const counts = new Map<string, number>();
  for (const p of patients) {
    const lang = (p.primaryLanguage ?? "Unbekannt").trim();
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

// === Top-Diagnosen ===
export async function getDiagnosisDistribution(params: StatsParams) {
  const { orgIds } = params;
  const { from, to } = resolveRange(params);

  const cases = await prisma.case.findMany({
    where: {
      organizationId: { in: orgIds },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    select: { patientId: true },
    distinct: ["patientId"],
  });

  const patientIds = cases.map((c) => c.patientId);
  if (patientIds.length === 0) return [];

  const diagnoses = await prisma.diagnosis.findMany({
    where: { patientId: { in: patientIds } },
    select: { description: true, icdCode: true },
  });

  const counts = new Map<string, number>();
  for (const d of diagnoses) {
    // Wenn ICD vorhanden, gruppieren wir nach ICD; sonst nach Description
    const key = d.icdCode ? `${d.icdCode} · ${d.description}` : d.description;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

// === Upcoming Events ===
export async function getUpcomingEvents(params: {
  orgIds: string[];
  userId: string;
}) {
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            { visibility: "PUBLIC" },
            {
              visibility: "ORGANIZATION",
              organizationId: { in: params.orgIds },
            },
            {
              visibility: "PRIVATE",
              creatorId: params.userId,
            },
          ],
        },
        { startsAt: { gte: now, lte: inAMonth } },
      ],
    },
    orderBy: { startsAt: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      startsAt: true,
      location: true,
      color: true,
      organization: { select: { name: true } },
    },
  });
}
