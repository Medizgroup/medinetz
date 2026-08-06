import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Der Protokoll-Inhalt (description) läuft seit der Live-Kollaboration nicht
// mehr über diese Route, sondern wird vom Collab-Server (Yjs/Hocuspocus)
// persistiert (siehe collab-server/index.ts). Diese Route bearbeitet nur noch
// die Metadaten Titel + Datum — beide werden im Editor direkt beim Verlassen
// des Felds gespeichert (kein "Speichern"-Button mehr nötig).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    select: { id: true, organizationId: true, title: true },
  });
  if (!protocol) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: protocol.organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership || !["COORDINATOR", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const data: { title?: string; date?: Date } = {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.date === "string" && body.date.trim()) {
    const date = new Date(body.date);
    if (!isNaN(date.getTime())) data.date = date;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.protocol.update({ where: { id }, data });

  await prisma.activity.create({
    data: {
      organizationId: protocol.organizationId,
      userId: session.user.id,
      action: "UPDATED",
      targetType: "protocol",
      targetId: id,
      metadata: { fields: Object.keys(data), title: data.title ?? protocol.title },
    },
  });

  return NextResponse.json({ ok: true });
}
