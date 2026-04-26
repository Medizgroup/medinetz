import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const organizationId = searchParams.get("organizationId")?.trim() ?? "";

  if (!organizationId) {
    return NextResponse.json([]);
  }

  // Mitgliedschaft prüfen
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json([]);
  }

  // Query in Tokens splitten
  const tokens = q.split(/\s+/).filter(Boolean);

  // "#42" oder "42" → caseNumber
  const numericQuery = q.replace(/^#/, "");
  const isNumeric = /^\d+$/.test(numericQuery);

  const tokenFilter =
    tokens.length === 0
      ? {}
      : {
          AND: tokens.map((t) => ({
            OR: [
              { title: { contains: t, mode: "insensitive" as const } },
              {
                patientPseudonym: {
                  contains: t,
                  mode: "insensitive" as const,
                },
              },
            ],
          })),
        };

  const cases = await prisma.case.findMany({
    where: {
      organizationId,
      ...(isNumeric
        ? {
            OR: [{ caseNumber: Number(numericQuery) }, tokenFilter],
          }
        : tokenFilter),
    },
    take: 8,
    orderBy: [{ caseNumber: "desc" }],
    select: {
      id: true,
      caseNumber: true,
      title: true,
      status: true,
      priority: true,
      patientPseudonym: true,
    },
  });

  return NextResponse.json(cases);
}
