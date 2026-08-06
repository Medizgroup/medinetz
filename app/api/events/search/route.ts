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

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  const events = await prisma.event.findMany({
    where: {
      AND: [
        {
          OR: [
            { visibility: "PUBLIC" },
            {
              visibility: "ORGANIZATION",
              organizationId: organizationId || { in: orgIds },
            },
            { visibility: "PRIVATE", creatorId: session.user.id },
          ],
        },
        q ? { title: { contains: q, mode: "insensitive" } } : {},
      ],
    },
    take: 8,
    orderBy: [{ startsAt: "desc" }],
    select: {
      id: true,
      title: true,
      startsAt: true,
      allDay: true,
    },
  });

  return NextResponse.json(events);
}
