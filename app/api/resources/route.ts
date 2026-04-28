import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { geocodeAddress } from "@/lib/utils/geocode";
import { userCanManageResources } from "@/lib/utils/resources/permissions";
import type { ResourceAvailability } from "@/generated/prisma/client";

const VALID_AVAILABILITY: ResourceAvailability[] = ["HIGH", "MEDIUM", "LOW"];

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [doctors, interpreters] = await Promise.all([
    prisma.doctor.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        specialty: true,
        languages: true,
        phone: true,
        email: true,
        address: true,
        practiceName: true,
        notes: true,
        isActive: true,
        availability: true,
        acceptsNewPatients: true,
        tags: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.interpreter.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        languages: true,
        phone: true,
        email: true,
        address: true,
        notes: true,
        isActive: true,
        availability: true,
        hourlyRate: true,
        tags: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    doctors: doctors.map((d) => ({ ...d, type: "DOCTOR" as const })),
    interpreters: interpreters.map((i) => ({
      ...i,
      hourlyRate: i.hourlyRate ? Number(i.hourlyRate) : null,
      type: "INTERPRETER" as const,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await userCanManageResources(session.user.id, prisma))) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const type = body.type;
  if (type !== "DOCTOR" && type !== "INTERPRETER") {
    return NextResponse.json({ error: "Ungültiger Typ." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: "Name ist erforderlich." },
      { status: 400 },
    );
  }

  // Geokodierung
  const address = body.address ? String(body.address).trim() : null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (typeof body.latitude === "number" && typeof body.longitude === "number") {
    // User hat Koordinaten manuell gesetzt
    latitude = body.latitude;
    longitude = body.longitude;
  } else if (address) {
    const geo = await geocodeAddress(address);
    if (geo) {
      latitude = geo.latitude;
      longitude = geo.longitude;
    }
  }

  const languages: string[] = Array.isArray(body.languages)
    ? body.languages.map((l: unknown) => String(l).trim()).filter(Boolean)
    : [];
  const tags: string[] = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const availability: ResourceAvailability | null = VALID_AVAILABILITY.includes(
    body.availability,
  )
    ? body.availability
    : "MEDIUM";

  const isActive = body.isActive !== false;

  if (type === "DOCTOR") {
    const created = await prisma.doctor.create({
      data: {
        name,
        specialty: body.specialty ? String(body.specialty).trim() : null,
        languages,
        phone: body.phone ? String(body.phone).trim() : null,
        email: body.email ? String(body.email).trim() : null,
        address,
        practiceName: body.practiceName
          ? String(body.practiceName).trim()
          : null,
        notes: body.notes ? String(body.notes).trim() : null,
        isActive,
        availability,
        acceptsNewPatients: body.acceptsNewPatients !== false,
        tags,
        latitude,
        longitude,
        createdBy: session.user.id,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id, type: "DOCTOR" });
  }

  // INTERPRETER
  const hourlyRate =
    body.hourlyRate !== undefined &&
    body.hourlyRate !== null &&
    body.hourlyRate !== ""
      ? Number(body.hourlyRate)
      : null;

  const created = await prisma.interpreter.create({
    data: {
      name,
      languages,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      address,
      notes: body.notes ? String(body.notes).trim() : null,
      isActive,
      availability,
      hourlyRate: hourlyRate ?? undefined,
      tags,
      latitude,
      longitude,
      createdBy: session.user.id,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id, type: "INTERPRETER" });
}
