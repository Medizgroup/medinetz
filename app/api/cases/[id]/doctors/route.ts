import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canUserEditCase } from "@/lib/utils/cases/permissions";
import { recalculateCaseTotal } from "@/lib/utils/cases/totals";
import { syncCaseDoctorEvent } from "@/lib/event/sync-resource-events";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.caseDoctor.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      appointmentDate: true,
      appointmentNotes: true,
      invoiceReceived: true,
      invoiceAmount: true,
      invoiceDate: true,
      invoicePaid: true,
      diagnosis: true,
      notes: true,
      createdAt: true,
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
          practiceName: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      invoiceAmount: i.invoiceAmount ? Number(i.invoiceAmount) : null,
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
  const doctorId = String(body?.doctorId ?? "").trim();
  if (!doctorId) {
    return NextResponse.json({ error: "doctorId fehlt." }, { status: 400 });
  }

  const created = await prisma.caseDoctor.create({
    data: {
      caseId: id,
      doctorId,
      appointmentDate: body?.appointmentDate
        ? new Date(body.appointmentDate)
        : null,
      appointmentNotes: body?.appointmentNotes
        ? String(body.appointmentNotes).trim()
        : null,
      diagnosis: body?.diagnosis ? String(body.diagnosis).trim() : null,
      notes: body?.notes ? String(body.notes).trim() : null,
      invoiceReceived: Boolean(body?.invoiceReceived),
      invoiceAmount:
        body?.invoiceAmount === null ||
        body?.invoiceAmount === undefined ||
        body?.invoiceAmount === ""
          ? undefined
          : Number(body.invoiceAmount),
      invoiceDate: body?.invoiceDate ? new Date(body.invoiceDate) : null,
      invoicePaid: Boolean(body?.invoicePaid),
      createdBy: session.user.id,
    },
    select: { id: true, caseId: true },
  });

  await syncCaseDoctorEvent(created.id);

  if (Boolean(body?.invoiceReceived)) {
    await recalculateCaseTotal(created.caseId);
  }

  return NextResponse.json({ id: created.id });
}
