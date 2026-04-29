import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canAccessPatient,
  canEditPatient,
} from "@/lib/utils/patients/permissions";
import { logPatientAccess } from "@/lib/utils/patients/access-log";

async function loadAndAuthorize(diagnosisId: string, userId: string) {
  const d = await prisma.diagnosis.findUnique({
    where: { id: diagnosisId },
    select: { id: true, patientId: true },
  });
  if (!d) return { error: "Not found", status: 404 as const };

  const access = await canAccessPatient(d.patientId, userId);
  if (!access.ok || !canEditPatient(access.role)) {
    return { error: "Keine Berechtigung.", status: 403 as const };
  }
  return { d };
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
  if (typeof body.description === "string" && body.description.trim()) {
    data.description = body.description.trim();
  }
  if ("icdCode" in body) {
    data.icdCode = body.icdCode
      ? String(body.icdCode).trim().toUpperCase()
      : null;
  }
  if ("diagnosedAt" in body) {
    data.diagnosedAt = body.diagnosedAt ? new Date(body.diagnosedAt) : null;
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim() : null;
  }
  if ("isActive" in body) {
    data.isActive = Boolean(body.isActive);
  }

  await prisma.diagnosis.update({ where: { id }, data });

  await logPatientAccess({
    patientId: r.d.patientId,
    userId: session.user.id,
    context: "diagnosis_edit",
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

  await prisma.diagnosis.delete({ where: { id } });

  await logPatientAccess({
    patientId: r.d.patientId,
    userId: session.user.id,
    context: "diagnosis_edit",
    contextId: id,
  });

  return NextResponse.json({ ok: true });
}
