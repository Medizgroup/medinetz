import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
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
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // const members = await prisma.organizationMember.findMany({
  //   where: { organizationId: id },
  //   orderBy: { joinedAt: "asc" },
  //   select: {
  //     id: true,
  //     role: true,
  //     joinedAt: true,
  //     user: {
  //       select: {
  //         id: true,
  //         email: true,
  //         displayName: true,
  //         name: true,
  //         avatarUrl: true,
  //         isActive: true,
  //       },
  //     },
  //   },
  // });

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
              firstName: true,
              lastName: true,
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
  return NextResponse.json(org);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const memberId = String(body?.memberId ?? "").trim();
  const role = body?.role as UserRole;

  if (!memberId || !VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "memberId und gültige Rolle erforderlich." },
      { status: 400 },
    );
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orgId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const memberId = String(body?.memberId ?? "").trim();
  if (!memberId) {
    return NextResponse.json({ error: "memberId fehlt." }, { status: 400 });
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
}
