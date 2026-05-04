import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = 30;
  const orgParam = searchParams.get("org") ?? "all";
  const search = searchParams.get("search") ?? "";

  const where: Prisma.ExpenseWhereInput = {};
  if (orgParam !== "all") where.organizationId = orgParam;
  if (search.trim()) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total, sum] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        description: true,
        amount: true,
        expenseDate: true,
        vendor: true,
        category: true,
        isPaid: true,
        notes: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    items: items.map((i) => ({ ...i, amount: Number(i.amount) })),
    total,
    page,
    pageSize,
    totalAmount: Number(sum._sum.amount ?? 0),
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isInstanceAdmin(session.user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (
    !body?.amount ||
    !body?.description ||
    !body?.expenseDate ||
    !body?.organizationId
  ) {
    return NextResponse.json(
      {
        error: "amount, description, expenseDate, organizationId erforderlich.",
      },
      { status: 400 },
    );
  }

  const e = await prisma.expense.create({
    data: {
      amount: Number(body.amount),
      description: String(body.description).trim(),
      expenseDate: new Date(body.expenseDate),
      vendor: body.vendor ? String(body.vendor).trim() : null,
      category: String(
        body.category,
      ).trim() as Prisma.ExpenseCreateInput["category"],
      isPaid: Boolean(body.isPaid),
      notes: body.notes ? String(body.notes).trim() : null,
      organizationId: String(body.organizationId),
    },
    select: { id: true },
  });

  return NextResponse.json({ id: e.id });
}
