import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canUserEditCase } from "@/lib/utils/cases/permissions";
import { recalculateCaseTotal } from "@/lib/utils/cases/totals";
import { syncCaseInterpreterEvent } from "@/lib/event/sync-resource-events";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.caseInterpreter.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      appointmentDate: true,
      hoursWorked: true,
      cost: true,
      invoiceReceived: true,
      invoicePaid: true,
      notes: true,
      createdAt: true,
      interpreter: {
        select: { id: true, name: true, languages: true },
      },
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      hoursWorked: i.hoursWorked ? Number(i.hoursWorked) : null,
      cost: i.cost ? Number(i.cost) : null,
    })),
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
  const interpreterId = String(body?.interpreterId ?? "").trim();
  if (!interpreterId) {
    return NextResponse.json(
      { error: "interpreterId fehlt." },
      { status: 400 },
    );
  }

  const created = await prisma.caseInterpreter.create({
    data: {
      caseId: id,
      interpreterId,
      appointmentDate: body?.appointmentDate
        ? new Date(body.appointmentDate)
        : null,
      hoursWorked:
        body?.hoursWorked !== undefined &&
        body?.hoursWorked !== null &&
        body?.hoursWorked !== ""
          ? Number(body.hoursWorked)
          : null,
      cost:
        body?.cost !== undefined && body?.cost !== null && body?.cost !== ""
          ? Number(body.cost)
          : null,
      notes: body?.notes ? String(body.notes).trim() : null,
      invoiceReceived: Boolean(body?.invoiceReceived),
      invoicePaid: Boolean(body?.invoicePaid),
      createdBy: session.user.id,
    },
    select: { id: true, caseId: true },
  });

  await syncCaseInterpreterEvent(created.id);
  if (Boolean(body?.invoiceReceived)) {
    await recalculateCaseTotal(created.caseId);
  }

  return NextResponse.json({ id: created.id });
}
