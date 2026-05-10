import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  notifyTodoAssignment,
  logTodoActivity,
} from "@/lib/utils/notifications/todos";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "mine"; // mine | created | unassigned | all
  const filter = searchParams.get("filter") ?? "open"; // open | done | all
  const priorityParam = searchParams.get("priority");

  // Sichtbarkeit: User sieht Todos die ihm zugewiesen sind, die er erstellt hat,
  // oder unzugewiesene ("für alle").
  const visibility: Prisma.TodoWhereInput = {
    OR: [{ assigneeId: userId }, { creatorId: userId }, { assigneeId: null }],
  };

  // View-spezifischer Scope (innerhalb des sichtbaren Set)
  let scope: Prisma.TodoWhereInput = {};
  if (view === "mine") scope = { assigneeId: userId };
  else if (view === "created") scope = { creatorId: userId };
  else if (view === "unassigned") scope = { assigneeId: null };
  // "all" → kein zusätzlicher Scope

  const where: Prisma.TodoWhereInput = { AND: [visibility, scope] };

  if (filter === "open") where.done = false;
  else if (filter === "done") where.done = true;

  if (priorityParam && ["1", "2", "3"].includes(priorityParam)) {
    where.priority = parseInt(priorityParam, 10);
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
      creatorId: true,
      assigneeId: true,
      creator: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
    },
  });

  // Target-Labels (Cases / Protokolle) wie bisher
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

  // Counts für die aktuelle View
  const baseCountWhere: Prisma.TodoWhereInput = { AND: [visibility, scope] };
  const [openCount, doneCount, mineOpen, unassignedOpen] = await Promise.all([
    prisma.todo.count({ where: { ...baseCountWhere, done: false } }),
    prisma.todo.count({ where: { ...baseCountWhere, done: true } }),
    prisma.todo.count({ where: { assigneeId: userId, done: false } }),
    prisma.todo.count({
      where: { AND: [visibility, { assigneeId: null }], done: false },
    }),
  ]);

  return NextResponse.json({
    items: enriched,
    openCount,
    doneCount,
    mineOpen,
    unassignedOpen,
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

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

  // Assignee: muss existierender, aktiver User sein (oder null)
  let assigneeId: string | null = null;
  if (body.assigneeId) {
    const target = await prisma.user.findFirst({
      where: { id: String(body.assigneeId), isActive: true },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Zuweisung: User nicht gefunden." },
        { status: 400 },
      );
    }
    assigneeId = target.id;
  }

  const created = await prisma.todo.create({
    data: {
      creatorId: userId,
      assigneeId,
      title,
      description,
      priority,
      dueDate,
      targetType: targetType && targetId ? targetType : null,
      targetId: targetType && targetId ? targetId : null,
    },
    select: { id: true, title: true, assigneeId: true },
  });

  // Activity
  await logTodoActivity({
    userId,
    todoId: created.id,
    action: "CREATED",
    metadata: { title: created.title, assigneeId: created.assigneeId },
  });

  // Notification bei direkter Zuweisung (nicht an sich selbst)
  if (created.assigneeId && created.assigneeId !== userId) {
    await Promise.all([
      notifyTodoAssignment({
        todoId: created.id,
        todoTitle: created.title,
        assigneeId: created.assigneeId,
        assigningUserId: userId,
      }),
      logTodoActivity({
        userId,
        todoId: created.id,
        action: "ASSIGNED",
        metadata: { to: created.assigneeId, title: created.title },
      }),
    ]);
  }

  return NextResponse.json({ id: created.id });
}
