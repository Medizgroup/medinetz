import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageOrgMembers } from "@/lib/utils/organizations/permissions";
import type { UserRole } from "@/generated/prisma/client";

const VALID_ROLES: UserRole[] = ["LIMITED", "VIEWER", "COORDINATOR", "ADMIN"];

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

  const org = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      isArchived: true,
      members: {
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              name: true,
              avatarUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!org)
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ...org, canAddInactive: isInstanceAdmin });
}

// Admin fügt einen bestehenden User direkt hinzu — ohne Einladung/Annehmen.
export async function POST(
  req: Request,
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

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId ?? "").trim();
  const role = body?.role as UserRole;
  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Benutzer und gültige Rolle erforderlich." },
      { status: 400 },
    );
  }

  const [org, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true, isArchived: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, deletedAt: true },
    }),
  ]);
  if (!org || org.isArchived) {
    return NextResponse.json(
      { error: "Organisation nicht gefunden oder archiviert." },
      { status: 404 },
    );
  }
  // Freischalten neuer Konten bleibt Sache des Instanz-Admins.
  if (!user || user.deletedAt || (!user.isActive && !isInstanceAdmin)) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden." },
      { status: 404 },
    );
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: id, userId } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Benutzer ist bereits Mitglied." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: {
        organizationId: id,
        userId,
        role,
        invitedBy: session.user.id,
      },
    }),
    // Instanz-Admin fügt ein noch nicht freigeschaltetes Konto hinzu →
    // in einem Schritt freischalten.
    ...(!user.isActive
      ? [prisma.user.update({ where: { id: userId }, data: { isActive: true } })]
      : []),
    prisma.notification.create({
      data: {
        userId,
        type: "ORGANIZATION",
        title: `Du wurdest zu „${org.name}“ hinzugefügt`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
