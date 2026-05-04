import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("amount" in body) {
    const n = Number(body.amount);
    if (!isNaN(n) && n > 0) data.amount = n;
  }
  if ("description" in body) data.description = String(body.description).trim();
  if ("expenseDate" in body) data.expenseDate = new Date(body.expenseDate);
  if ("vendor" in body) data.vendor = body.vendor || null;
  if ("category" in body) data.category = body.category || null;
  if ("isPaid" in body) data.isPaid = Boolean(body.isPaid);
  if ("notes" in body) data.notes = body.notes || null;

  await prisma.expense.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
