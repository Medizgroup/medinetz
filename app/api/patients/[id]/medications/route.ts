import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canAccessPatient,
  canEditPatient,
} from "@/lib/utils/patients/permissions";
import { logPatientAccess } from "@/lib/utils/patients/access-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await canAccessPatient(id, session.user.id);
  if (!access.ok || !canEditPatient(access.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Name ist erforderlich." },
      { status: 400 },
    );
  }

  const created = await prisma.medication.create({
    data: {
      patientId: id,
      name,
      dosage: body?.dosage ? String(body.dosage).trim() : null,
      frequency: body?.frequency ? String(body.frequency).trim() : null,
      prescribedAt: body?.prescribedAt ? new Date(body.prescribedAt) : null,
      notes: body?.notes ? String(body.notes).trim() : null,
      isActive: body?.isActive !== false,
      createdBy: session.user.id,
    },
    select: { id: true },
  });

  await logPatientAccess({
    patientId: id,
    userId: session.user.id,
    context: "medication_edit",
    contextId: created.id,
  });

  return NextResponse.json({ id: created.id });
}
