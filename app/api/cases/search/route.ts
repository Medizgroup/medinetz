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
    return NextResponse.json({ cases: [] });
  }

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
    return NextResponse.json({ cases: [] });
  }

  const cases = await prisma.case.findMany({
    where: {
      organizationId,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { patientPseudonym: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
    select: {
      id: true,
      caseNumber: true,
      title: true,
      status: true,
      priority: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ cases });
}
