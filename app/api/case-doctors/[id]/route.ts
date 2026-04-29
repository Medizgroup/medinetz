import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canUserEditCase } from "@/lib/utils/cases/permissions";
import { recalculateCaseTotal } from "@/lib/utils/cases/totals";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.caseDoctor.findUnique({
    where: { id },
    select: { id: true, caseId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canUserEditCase(existing.caseId, session.user.id))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body)
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("appointmentDate" in body) {
    data.appointmentDate = body.appointmentDate
      ? new Date(body.appointmentDate)
      : null;
  }
  if ("appointmentNotes" in body) {
    data.appointmentNotes = body.appointmentNotes
      ? String(body.appointmentNotes).trim()
      : null;
  }
  if ("invoiceReceived" in body) {
    data.invoiceReceived = Boolean(body.invoiceReceived);
  }
  if ("invoiceAmount" in body) {
    data.invoiceAmount =
      body.invoiceAmount === null || body.invoiceAmount === ""
        ? null
        : Number(body.invoiceAmount);
  }
  if ("invoiceDate" in body) {
    data.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
  }
  if ("invoicePaid" in body) {
    data.invoicePaid = Boolean(body.invoicePaid);
  }
  if ("diagnosis" in body) {
    data.diagnosis = body.diagnosis ? String(body.diagnosis).trim() : null;
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim() : null;
  }

  await prisma.caseDoctor.update({ where: { id }, data });
  await recalculateCaseTotal(existing.caseId);

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

  const existing = await prisma.caseDoctor.findUnique({
    where: { id },
    select: { id: true, caseId: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await canUserEditCase(existing.caseId, session.user.id))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  await prisma.caseDoctor.delete({ where: { id } });
  await recalculateCaseTotal(existing.caseId);

  return NextResponse.json({ ok: true });
}
