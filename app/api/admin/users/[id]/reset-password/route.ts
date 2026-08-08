import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";

const RESET_PASSWORD = "password";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hashed = await hashPassword(RESET_PASSWORD);

  const credentialAccount = await prisma.account.findFirst({
    where: { userId: id, providerId: "credential" },
    select: { id: true },
  });

  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: { password: hashed },
    });
  } else {
    // Falls (noch) kein Credential-Account existiert (z.B. reiner
    // OAuth-User) legen wir einen an, damit Email+Passwort-Login möglich wird.
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { id },
    data: { mustChangePassword: true },
  });

  return NextResponse.json({ ok: true });
}
