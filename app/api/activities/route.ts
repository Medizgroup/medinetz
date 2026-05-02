import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ActivityAction, Prisma } from "@/generated/prisma/client";

const VALID_ACTIONS: ActivityAction[] = [
  "CREATED",
  "UPDATED",
  "COMMENTED",
  "ASSIGNED",
  "CLOSED",
  "REOPENED",
  "MENTIONED",
  "ATTACHED",
];

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const orgFilter = searchParams.get("organizationId") ?? "all";
  const actionFilter = searchParams.get("action") ?? "all";
  const targetTypeFilter = searchParams.get("targetType") ?? "all";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = 30;

  // Org-Mitgliedschaften des Users
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  const allowedOrgIds = memberships.map((m) => m.organizationId);

  if (allowedOrgIds.length === 0) {
    return NextResponse.json({
      items: [],
      total: 0,
      page,
      pageSize,
      orgs: [],
    });
  }

  // Welche Orgs zeigen wir?
  let orgIdsToQuery: string[];
  if (orgFilter === "all") {
    orgIdsToQuery = allowedOrgIds;
  } else if (allowedOrgIds.includes(orgFilter)) {
    orgIdsToQuery = [orgFilter];
  } else {
    orgIdsToQuery = []; // versucht Zugriff auf fremde Org → leeres Result
  }

  const where: Prisma.ActivityWhereInput = {
    organizationId: { in: orgIdsToQuery },
  };

  if (
    actionFilter !== "all" &&
    VALID_ACTIONS.includes(actionFilter as ActivityAction)
  ) {
    where.action = actionFilter as ActivityAction;
  }
  if (targetTypeFilter !== "all") {
    where.targetType = targetTypeFilter;
  }

  if (fromParam || toParam) {
    where.createdAt = {};
    if (fromParam) {
      const from = new Date(fromParam);
      if (!isNaN(from.getTime())) where.createdAt.gte = from;
    }
    if (toParam) {
      const to = new Date(toParam);
      if (!isNaN(to.getTime())) {
        // Bis-Datum inklusive (Tag-Ende)
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }
  }

  const [items, total, orgs] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
        metadata: true,
        user: {
          select: { id: true, displayName: true, name: true, avatarUrl: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.activity.count({ where }),
    prisma.organization.findMany({
      where: { id: { in: allowedOrgIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ items, total, page, pageSize, orgs });
}
