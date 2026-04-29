import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canAccessPatient,
  canEditPatient,
} from "@/lib/utils/patients/permissions";
import { logPatientAccess } from "@/lib/utils/patients/access-log";

async function loadAndAuthorize(medId: string, userId: string) {
  const m = await prisma.medication.findUnique({
    where: { id: medId },
    select: { id: true, patientId: true },
  });
  if (!m) return { error: "Not found", status: 404 as const };

  const access = await canAccessPatient(m.patientId, userId);
  if (!access.ok || !canEditPatient(access.role)) {
    return { error: "Keine Berechtigung.", status: 403 as const };
  }
  return { m };
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
  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if ("dosage" in body)
    data.dosage = body.dosage ? String(body.dosage).trim() : null;
  if ("frequency" in body)
    data.frequency = body.frequency ? String(body.frequency).trim() : null;
  if ("prescribedAt" in body)
    data.prescribedAt = body.prescribedAt ? new Date(body.prescribedAt) : null;
  if ("notes" in body)
    data.notes = body.notes ? String(body.notes).trim() : null;
  if ("isActive" in body) data.isActive = Boolean(body.isActive);

  await prisma.medication.update({ where: { id }, data });

  await logPatientAccess({
    patientId: r.m.patientId,
    userId: session.user.id,
    context: "medication_edit",
    contextId: id,
  });

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

  await prisma.medication.delete({ where: { id } });

  await logPatientAccess({
    patientId: r.m.patientId,
    userId: session.user.id,
    context: "medication_edit",
    contextId: id,
  });

  return NextResponse.json({ ok: true });
}
