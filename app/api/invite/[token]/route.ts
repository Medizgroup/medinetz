// app/api/invite/[token]/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      organization: { select: { id: true, name: true, slug: true } },
      inviter: { select: { displayName: true, firstName: true, email: true } },
    },
  });

  if (!invite)
    return NextResponse.json(
      { error: "Einladung nicht gefunden." },
      { status: 404 },
    );
  if (invite.acceptedAt)
    return NextResponse.json(
      { error: "Einladung bereits verwendet." },
      { status: 410 },
    );
  if (new Date(invite.expiresAt) < new Date())
    return NextResponse.json(
      { error: "Einladung abgelaufen." },
      { status: 410 },
    );

  return NextResponse.json({
    invite,
    loggedInEmail: session?.user?.email ?? null,
  });
}
