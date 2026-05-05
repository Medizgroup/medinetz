import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import type { UserRole } from "@/generated/prisma/client";

const VALID_ROLES: UserRole[] = ["LIMITED", "VIEWER", "COORDINATOR", "ADMIN"];

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, userId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const role = body?.role as UserRole;
  if (!VALID_ROLES.includes(role))
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });

  await prisma.organizationMember.update({
    where: { organizationId_userId: { organizationId: id, userId } },
    data: { role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, userId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.organizationMember.delete({
    where: { organizationId_userId: { organizationId: id, userId } },
  });

  return NextResponse.json({ ok: true });
}
