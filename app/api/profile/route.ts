import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; // <- dein better-auth server client

import prisma from "@/lib/prisma";
import { patchSchema } from "@/lib/types/profile";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      image: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { firstName, lastName, avatarUrl, name } = parsed.data;

  // Optional: wenn du "name" automatisch aus Vor-/Nachname generieren willst:
  const computedName =
    (name ?? [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ")) ||
    undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      // BetterAuth field
      name: computedName,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      image: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user });
}
