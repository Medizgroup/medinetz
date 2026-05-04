import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = 30;
  const orgParam = searchParams.get("org") ?? "all";
  const search = searchParams.get("search") ?? "";

  const where: Prisma.DonationWhereInput = {};
  if (orgParam !== "all") {
    where.organizationId = orgParam;
  }
  if (search.trim()) {
    where.OR = [
      { donorName: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total, sum] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { donationDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        donorName: true,
        amount: true,
        donationDate: true,
        isAnonymous: true,
        receiptSent: true,
        notes: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({ where, _sum: { amount: true } }),
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.amount || !body?.donationDate) {
    return NextResponse.json(
      { error: "amount und donationDate erforderlich." },
      { status: 400 },
    );
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Ungültiger Betrag." }, { status: 400 });
  }

  const d = await prisma.donation.create({
    data: {
      amount,
      donationDate: new Date(body.donationDate),
      donorName: body.donorName ? String(body.donorName).trim() : null,
      isAnonymous: Boolean(body.isAnonymous),
      receiptSent: Boolean(body.receiptSent),
      notes: body.notes ? String(body.notes).trim() : null,
      organizationId: body.organizationId || null,
      creator: { connect: { id: session.user.id } },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: d.id });
}
