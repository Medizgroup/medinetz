import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function loadAndAuthorize(todoId: string, userId: string) {
  const t = await prisma.todo.findUnique({
    where: { id: todoId },
    select: { id: true, userId: true },
  });
  if (!t) return { error: "Not found", status: 404 as const };
  if (t.userId !== userId) {
    return { error: "Keine Berechtigung.", status: 403 as const };
  }
  return { t };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const r = await loadAndAuthorize(id, session.user.id);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if ("description" in body) {
    data.description = body.description
      ? String(body.description).trim()
      : null;
  }
  if ("priority" in body) {
    const p = Number(body.priority);
    if ([1, 2, 3].includes(p)) data.priority = p;
  }
  if ("dueDate" in body) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if ("done" in body) {
    const newDone = Boolean(body.done);
    data.done = newDone;
    data.completedAt = newDone ? new Date() : null;
  }
  if ("targetType" in body || "targetId" in body) {
    const tt = body.targetType ? String(body.targetType).trim() : null;
    const tid = body.targetId ? String(body.targetId).trim() : null;
    data.targetType = tt && tid ? tt : null;
    data.targetId = tt && tid ? tid : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.todo.update({ where: { id }, data });
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

  const r = await loadAndAuthorize(id, session.user.id);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
