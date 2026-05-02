import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "open"; // "open" | "done" | "all"
  const priorityParam = searchParams.get("priority"); // "1" | "2" | "3" | null
  const targetTypeParam = searchParams.get("targetType");

  const where: Prisma.TodoWhereInput = {
    userId: session.user.id,
  };

  if (filter === "open") where.done = false;
  else if (filter === "done") where.done = true;

  if (priorityParam && ["1", "2", "3"].includes(priorityParam)) {
    where.priority = parseInt(priorityParam, 10);
  }

  if (targetTypeParam && targetTypeParam !== "all") {
    where.targetType = targetTypeParam;
  }

  const items = await prisma.todo.findMany({
    where,
    orderBy: [
      { done: "asc" },
      { priority: "desc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      done: true,
      priority: true,
      dueDate: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      completedAt: true,
    },
  });

  // Target-Labels für Cases / Protokolle einsammeln
  const caseIds: string[] = [];
  const protocolIds: string[] = [];
  for (const t of items) {
    if (t.targetType === "case" && t.targetId) caseIds.push(t.targetId);
    else if (t.targetType === "protocol" && t.targetId)
      protocolIds.push(t.targetId);
  }

  const [cases, protocols] = await Promise.all([
    caseIds.length
      ? prisma.case.findMany({
          where: { id: { in: caseIds } },
          select: { id: true, caseNumber: true, title: true },
        })
      : Promise.resolve([]),
    protocolIds.length
      ? prisma.protocol.findMany({
          where: { id: { in: protocolIds } },
          select: { id: true, protocolNumber: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  const caseMap = new Map(cases.map((c) => [c.id, c]));
  const protocolMap = new Map(protocols.map((p) => [p.id, p]));

  const enriched = items.map((t) => {
    let targetLabel: string | null = null;
    if (t.targetType === "case" && t.targetId) {
      const c = caseMap.get(t.targetId);
      if (c) targetLabel = `#${c.caseNumber} · ${c.title}`;
    } else if (t.targetType === "protocol" && t.targetId) {
      const p = protocolMap.get(t.targetId);
      if (p) targetLabel = `#${p.protocolNumber} · ${p.title}`;
    }
    return { ...t, targetLabel };
  });

  const counts = await prisma.todo.groupBy({
    by: ["done"],
    where: { userId: session.user.id },
    _count: { _all: true },
  });

  const openCount = counts.find((c) => c.done === false)?._count._all ?? 0;
  const doneCount = counts.find((c) => c.done === true)?._count._all ?? 0;

  return NextResponse.json({
    items: enriched,
    openCount,
    doneCount,
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { error: "Titel ist erforderlich." },
      { status: 400 },
    );
  }

  const priorityRaw = Number(body.priority ?? 2);
  const priority = [1, 2, 3].includes(priorityRaw) ? priorityRaw : 2;

  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const description = body.description ? String(body.description).trim() : null;

  const targetType = body.targetType ? String(body.targetType).trim() : null;
  const targetId = body.targetId ? String(body.targetId).trim() : null;

  const created = await prisma.todo.create({
    data: {
      userId: session.user.id,
      title,
      description,
      priority,
      dueDate,
      targetType: targetType && targetId ? targetType : null,
      targetId: targetType && targetId ? targetId : null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
