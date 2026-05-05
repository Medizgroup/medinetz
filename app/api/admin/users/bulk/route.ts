// app/api/admin/users/bulk/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const { action, userIds }: { action: string; userIds: string[] } = body ?? {};

  if (!Array.isArray(userIds) || userIds.length === 0)
    return NextResponse.json(
      { error: "Keine User angegeben." },
      { status: 400 },
    );

  // eigenen Account schützen
  const safeIds = userIds.filter((id) => id !== session.user.id);

  if (action === "deactivate") {
    await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data: { isActive: false },
    });
  } else if (action === "activate") {
    await prisma.user.updateMany({
      where: { id: { in: safeIds } },
      data: { isActive: true },
    });
  } else {
    return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, affected: safeIds.length });
}
