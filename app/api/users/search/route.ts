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

  // Query in Tokens splitten (z.B. "Vp" → ["Vp"], "vocs p" → ["vocs", "p"])
  const tokens = q.split(/\s+/).filter(Boolean);

  /**
   * Ein Token matched, wenn er Substring von IRGENDEINEM Namen-/E-Mail-Feld ist.
   * Alle Tokens müssen matchen (AND).
   */
  const tokenFilter =
    tokens.length === 0
      ? {}
      : {
          AND: tokens.map((t) => ({
            OR: [
              { displayName: { contains: t, mode: "insensitive" as const } },
              { name: { contains: t, mode: "insensitive" as const } },
              { firstName: { contains: t, mode: "insensitive" as const } },
              { lastName: { contains: t, mode: "insensitive" as const } },
              { email: { contains: t, mode: "insensitive" as const } },
            ],
          })),
        };

  // Mit orgId: nur Mitglieder der Org. Ohne: alle aktiven (für Backwards-Compat im Comment-Form)
  if (organizationId) {
    const requesterMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!requesterMembership) {
      return NextResponse.json([]);
    }

    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        user: {
          isActive: true,
          ...tokenFilter,
        },
      },
      take: 8,
      select: {
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { displayName: "asc" } }, { user: { name: "asc" } }],
    });

    return NextResponse.json(members.map((m) => formatUser(m.user)));
  }

  // Fallback: alle aktiven User (kein org-Scope)
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...tokenFilter,
    },
    take: 8,
    select: {
      id: true,
      displayName: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      email: true,
    },
    orderBy: [{ displayName: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users.map(formatUser));
}

function formatUser(u: {
  id: string;
  displayName: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
}) {
  return {
    id: u.id,
    displayName:
      u.displayName ||
      u.name ||
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      u.email,
    avatarUrl: u.avatarUrl,
    email: u.email,
  };
}
