import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageOrgMembers } from "@/lib/utils/organizations/permissions";

// Personen, die der Org direkt hinzugefügt werden können. Noch nicht
// freigeschaltete Konten sieht nur der Instanz-Admin (Hinzufügen schaltet
// sie dann frei, siehe POST .../members).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { allowed, isInstanceAdmin } = await canManageOrgMembers(
    session.user.id,
    id,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(isInstanceAdmin ? {} : { isActive: true }),
      organizationMembers: { none: { organizationId: id } },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      name: true,
      avatarUrl: true,
      isActive: true,
    },
    orderBy: [{ isActive: "asc" }, { displayName: "asc" }, { email: "asc" }],
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.displayName || u.name || u.email,
      email: u.email,
      avatarUrl: u.avatarUrl,
      isActive: u.isActive,
    })),
  );
}
