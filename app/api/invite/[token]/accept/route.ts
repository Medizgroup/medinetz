// app/api/invite/[token]/accept/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    select: {
      id: true,
      organizationId: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      email: true,
    },
  });

  if (!invite)
    return NextResponse.json(
      { error: "Einladung nicht gefunden." },
      { status: 404 },
    );
  if (invite.acceptedAt)
    return NextResponse.json({ error: "Bereits verwendet." }, { status: 410 });
  if (new Date(invite.expiresAt) < new Date())
    return NextResponse.json({ error: "Abgelaufen." }, { status: 410 });

  // upsert: falls schon Mitglied → Rolle aktualisieren
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId: session.user.id,
      },
    },
    create: {
      organizationId: invite.organizationId,
      userId: session.user.id,
      role: invite.role,
    },
    update: { role: invite.role },
  });

  await prisma.organizationInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({ organizationId: invite.organizationId });
}
