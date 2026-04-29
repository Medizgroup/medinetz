import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  canAccessPatient,
  canEditPatient,
} from "@/lib/utils/patients/permissions";
import { logPatientAccess } from "@/lib/utils/patients/access-log";
import type {
  Gender,
  ResidenceStatus,
  InsuranceStatus,
} from "@/generated/prisma/client";

const VALID_GENDERS: Gender[] = ["FEMALE", "MALE", "DIVERSE", "UNKNOWN"];
const VALID_RESIDENCE: ResidenceStatus[] = [
  "UNDOCUMENTED",
  "ASYLUM_PROCESS",
  "TOLERATED",
  "RECOGNIZED",
  "EU_CITIZEN_NO_INSURANCE",
  "OTHER",
];
const VALID_INSURANCE: InsuranceStatus[] = ["NONE", "BG", "KSCHG", "OTHER"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await canAccessPatient(id, session.user.id);
  if (!access.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      diagnoses: {
        orderBy: [{ isActive: "desc" }, { diagnosedAt: "desc" }],
      },
      medications: {
        orderBy: [{ isActive: "desc" }, { prescribedAt: "desc" }],
      },
    },
  });

  if (!patient || patient.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logPatientAccess({
    patientId: id,
    userId: session.user.id,
    context: "patient_view",
  });

  return NextResponse.json({ patient });
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

  const access = await canAccessPatient(id, session.user.id);
  if (!access.ok || !canEditPatient(access.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.pseudonym === "string" && body.pseudonym.trim()) {
    data.pseudonym = body.pseudonym.trim();
  }
  if ("birthYear" in body) {
    const y = Number(body.birthYear);
    data.birthYear =
      Number.isInteger(y) && y >= 1900 && y <= new Date().getFullYear()
        ? y
        : null;
  }
  if (VALID_GENDERS.includes(body.gender)) {
    data.gender = body.gender;
  }
  if ("countryOfOrigin" in body) {
    data.countryOfOrigin = body.countryOfOrigin
      ? String(body.countryOfOrigin).trim()
      : null;
  }
  if ("primaryLanguage" in body) {
    data.primaryLanguage = body.primaryLanguage
      ? String(body.primaryLanguage).trim()
      : null;
  }
  if ("postalCodePrefix" in body) {
    // Nur 3 Zeichen erlauben
    const v = body.postalCodePrefix
      ? String(body.postalCodePrefix).trim().slice(0, 3)
      : null;
    data.postalCodePrefix = v;
  }
  if (VALID_RESIDENCE.includes(body.residenceStatus)) {
    data.residenceStatus = body.residenceStatus;
  }
  if (VALID_INSURANCE.includes(body.insuranceStatus)) {
    data.insuranceStatus = body.insuranceStatus;
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim() : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.patient.update({
    where: { id },
    data,
  });

  await logPatientAccess({
    patientId: id,
    userId: session.user.id,
    context: "patient_edit",
  });

  return NextResponse.json({ ok: true });
}
