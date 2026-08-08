import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canUserEditCase,
  canUserViewCase,
} from "@/lib/utils/cases/permissions";
import { recalculateCaseTotal } from "@/lib/utils/cases/totals";
import type { ExpenseCategory } from "@/generated/prisma/client";

const VALID_CATEGORIES: ExpenseCategory[] = [
  "DOCTOR",
  "INTERPRETER",
  "MEDICATION",
  "LAB",
  "OTHER",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canUserViewCase(id, session.user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await prisma.caseCost.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      description: true,
      amount: true,
      invoiceDate: true,
      invoicePaid: true,
      notes: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({ ...i, amount: Number(i.amount) })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canUserEditCase(id, session.user.id))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const description = String(body?.description ?? "").trim();
  const category = VALID_CATEGORIES.includes(body?.category)
    ? (body.category as ExpenseCategory)
    : "OTHER";
  const amount = Number(body?.amount);

  if (!description) {
    return NextResponse.json(
      { error: "Beschreibung ist erforderlich." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json(
      { error: "Ungültiger Betrag." },
      { status: 400 },
    );
  }

  const created = await prisma.caseCost.create({
    data: {
      caseId: id,
      category,
      description,
      amount,
      invoiceDate: body?.invoiceDate ? new Date(body.invoiceDate) : null,
      invoicePaid: Boolean(body?.invoicePaid),
      notes: body?.notes ? String(body.notes).trim() : null,
      createdBy: session.user.id,
    },
    select: { id: true, caseId: true },
  });

  await recalculateCaseTotal(created.caseId);

  return NextResponse.json({ id: created.id });
}
