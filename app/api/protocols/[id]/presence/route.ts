import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ACTIVE_WINDOW_MS = 30_000;

async function authorize(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    select: { organizationId: true },
  });
  if (!protocol) return null;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: protocol.organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });
  if (!membership) return null;

  return { userId: session.user.id };
}

// Heartbeat: meldet den eigenen Nutzer als aktiv und gibt die anderen aktiven zurück
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await authorize(id);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.protocolPresence.upsert({
    where: { protocolId_userId: { protocolId: id, userId: ctx.userId } },
    create: { protocolId: id, userId: ctx.userId },
    update: { lastSeenAt: new Date() },
  });

  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const others = await prisma.protocolPresence.findMany({
    where: {
      protocolId: id,
      lastSeenAt: { gte: since },
      NOT: { userId: ctx.userId },
    },
    select: {
      user: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({
    active: others.map((o) => ({
      id: o.user.id,
      name:
        o.user.displayName ?? o.user.name ?? `User ${o.user.id.slice(0, 6)}`,
      avatarUrl: o.user.avatarUrl,
    })),
  });
}

// Verlassen
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await authorize(id);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.protocolPresence.deleteMany({
    where: { protocolId: id, userId: ctx.userId },
  });

  return NextResponse.json({ ok: true });
}
