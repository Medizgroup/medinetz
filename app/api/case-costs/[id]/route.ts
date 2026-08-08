import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canUserEditCase } from "@/lib/utils/cases/permissions";
import { recalculateCaseTotal } from "@/lib/utils/cases/totals";
import type { ExpenseCategory } from "@/generated/prisma/client";

const VALID_CATEGORIES: ExpenseCategory[] = [
  "DOCTOR",
  "INTERPRETER",
  "MEDICATION",
  "LAB",
  "OTHER",
];

async function loadAndAuthorize(costId: string, userId: string) {
  const cost = await prisma.caseCost.findUnique({
    where: { id: costId },
    select: { id: true, caseId: true },
  });
  if (!cost) return { error: "Not found", status: 404 as const };

  if (!(await canUserEditCase(cost.caseId, userId))) {
    return { error: "Keine Berechtigung.", status: 403 as const };
  }
  return { cost };
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

  const r = await loadAndAuthorize(id, session.user.id);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("category" in body && VALID_CATEGORIES.includes(body.category)) {
    data.category = body.category;
  }
  if (typeof body.description === "string" && body.description.trim()) {
    data.description = body.description.trim();
  }
  if ("amount" in body) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Ungültiger Betrag." },
        { status: 400 },
      );
    }
    data.amount = amount;
  }
  if ("invoiceDate" in body) {
    data.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
  }
  if ("invoicePaid" in body) {
    data.invoicePaid = Boolean(body.invoicePaid);
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim() : null;
  }

  await prisma.caseCost.update({ where: { id }, data });
  await recalculateCaseTotal(r.cost.caseId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const r = await loadAndAuthorize(id, session.user.id);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });

  await prisma.caseCost.delete({ where: { id } });
  await recalculateCaseTotal(r.cost.caseId);

  return NextResponse.json({ ok: true });
}
