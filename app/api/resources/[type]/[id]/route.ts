import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/utils/geocode";
import { userCanManageResources } from "@/lib/utils/resources/permissions";
import type { ResourceAvailability } from "@/generated/prisma/client";

const VALID_AVAILABILITY: ResourceAvailability[] = ["HIGH", "MEDIUM", "LOW"];

type RouteParams = { params: Promise<{ type: string; id: string }> };

async function loadByType(type: string, id: string) {
  if (type === "doctor") {
    return prisma.doctor.findUnique({ where: { id } });
  }
  if (type === "interpreter") {
    return prisma.interpreter.findUnique({ where: { id } });
  }
  return null;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { type, id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await userCanManageResources(session.user.id, prisma))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const existing = await loadByType(type, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  // Build common data
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if ("phone" in body) {
    data.phone = body.phone ? String(body.phone).trim() : null;
  }
  if ("email" in body) {
    data.email = body.email ? String(body.email).trim() : null;
  }
  if ("notes" in body) {
    data.notes = body.notes ? String(body.notes).trim() : null;
  }
  if ("isActive" in body) {
    data.isActive = Boolean(body.isActive);
  }
  if (VALID_AVAILABILITY.includes(body.availability)) {
    data.availability = body.availability;
  }
  if (Array.isArray(body.languages)) {
    data.languages = body.languages
      .map((l: unknown) => String(l).trim())
      .filter(Boolean);
  }
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  }

  // Address + Geo
  if ("address" in body) {
    const address = body.address ? String(body.address).trim() : null;
    data.address = address;

    if (
      typeof body.latitude === "number" &&
      typeof body.longitude === "number"
    ) {
      data.latitude = body.latitude;
      data.longitude = body.longitude;
    } else if (address && address !== existing.address) {
      const geo = await geocodeAddress(address);
      if (geo) {
        data.latitude = geo.latitude;
        data.longitude = geo.longitude;
      } else {
        data.latitude = null;
        data.longitude = null;
      }
    } else if (!address) {
      data.latitude = null;
      data.longitude = null;
    }
  } else if (
    typeof body.latitude === "number" &&
    typeof body.longitude === "number"
  ) {
    // Manuelles Verschieben des Pins ohne Adressänderung
    data.latitude = body.latitude;
    data.longitude = body.longitude;
  }

  // Doctor-only
  if (type === "doctor") {
    if ("specialty" in body)
      data.specialty = body.specialty ? String(body.specialty).trim() : null;
    if ("practiceName" in body)
      data.practiceName = body.practiceName
        ? String(body.practiceName).trim()
        : null;
    if ("acceptsNewPatients" in body)
      data.acceptsNewPatients = Boolean(body.acceptsNewPatients);

    await prisma.doctor.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  // Interpreter-only
  if (type === "interpreter") {
    if ("hourlyRate" in body) {
      data.hourlyRate =
        body.hourlyRate === null || body.hourlyRate === ""
          ? null
          : Number(body.hourlyRate);
    }
    await prisma.interpreter.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ungültiger Typ." }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { type, id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await userCanManageResources(session.user.id, prisma))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  if (type === "doctor") {
    await prisma.doctor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  if (type === "interpreter") {
    await prisma.interpreter.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Ungültiger Typ." }, { status: 400 });
}
