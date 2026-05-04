import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomBytes } from "crypto";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import { UserRole } from "@/generated/prisma/enums";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.organizationId || !body?.role) {
    return NextResponse.json(
      { error: "email, organizationId und role sind erforderlich." },
      { status: 400 },
    );
  }

  const email = String(body.email).trim().toLowerCase();
  const organizationId = String(body.organizationId).trim();
  const role = String(body.role).trim();

  if (!["LIMITED", "VIEWER", "COORDINATOR", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  // Org prüfen
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json(
      { error: "Organisation nicht gefunden." },
      { status: 404 },
    );
  }

  // Email prüfen
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Kein Benutzer mit dieser E-Mail-Adresse gefunden." },
      { status: 404 },
    );
  }

  // Existierenden Invite für diese Email+Org löschen
  await prisma.organizationInvite.deleteMany({
    where: { email, organizationId },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage

  const invite = await prisma.organizationInvite.create({
    data: {
      email,
      organizationId,
      role: role as UserRole,
      token,
      expiresAt,
      invitedBy: session.user.id,
      //   status: "PENDING",
    },
    select: { id: true, token: true },
  });

  // Invite-Link zum Kopieren — Basis-URL aus Request
  const baseUrl = new URL(req.url).origin;
  const inviteLink = `${baseUrl}/invite/${invite.token}`;

  return NextResponse.json({ id: invite.id, inviteLink });
}
