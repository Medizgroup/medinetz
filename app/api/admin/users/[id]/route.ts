import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isInstanceAdmin } from "@/lib/utils/admin/permissions";
import { Prisma } from "@/generated/prisma/client";
import { DELETED_USER_NAME } from "@/lib/helper/user";

export async function PATCH(
  req: Request,
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

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if ("isActive" in body) data.isActive = Boolean(body.isActive);
  if ("isInstanceAdmin" in body) {
    // Verhindere, dass du dich selbst entadminst
    if (id === session.user.id && !body.isInstanceAdmin) {
      return NextResponse.json(
        { error: "Du kannst dir selbst den Admin-Status nicht entziehen." },
        { status: 400 },
      );
    }
    data.isInstanceAdmin = Boolean(body.isInstanceAdmin);
  }
  if (typeof body.displayName === "string") {
    data.displayName = body.displayName.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.user.update({ where: { id }, data });
  // Deaktivierte Konten sofort ausloggen — inaktive User bekommen keine neue
  // Session (lib/auth.ts), bestehende würden sonst bis zum Ablauf gelten.
  if (data.isActive === false) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }
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
  if (!(await isInstanceAdmin(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst löschen." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });
  if (!target || target.deletedAt) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  // Anonymisieren statt hart löschen: Fälle, Kommentare, Protokolle usw.
  // verweisen weiter auf den User-Datensatz und gehören danach einem
  // „Gelöschten Benutzer“. Alle personenbezogenen Daten und der Login
  // werden entfernt (DSGVO), private Daten der Person gelöscht.
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.account.deleteMany({ where: { userId: id } }),
    prisma.organizationMember.deleteMany({ where: { userId: id } }),
    prisma.userPreference.deleteMany({ where: { userId: id } }),
    prisma.caseWatcher.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.mention.deleteMany({ where: { mentionedUserId: id } }),
    prisma.event.deleteMany({
      where: { creatorId: id, visibility: "PRIVATE" },
    }),
    // Persönliche Todos (nur für sich selbst) entfallen, an andere
    // vergebene bleiben bestehen, eigene Zuweisungen werden frei.
    prisma.todo.deleteMany({ where: { creatorId: id, assigneeId: id } }),
    prisma.todo.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: null },
    }),
    prisma.case.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: null },
    }),
    prisma.user.update({
      where: { id },
      data: {
        email: `deleted-${id}@deleted.invalid`,
        name: DELETED_USER_NAME,
        displayName: DELETED_USER_NAME,
        firstName: null,
        lastName: null,
        image: null,
        avatarUrl: null,
        avatarConfig: Prisma.DbNull,
        emailVerified: false,
        isActive: false,
        isInstanceAdmin: false,
        mustChangePassword: false,
        lastLoginAt: null,
        deletedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
