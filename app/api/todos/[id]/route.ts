import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  notifyTodoAssignment,
  notifyTodoCompleted,
  logTodoActivity,
} from "@/lib/utils/notifications/todos";

async function loadAndAuthorize(todoId: string, userId: string) {
  const t = await prisma.todo.findUnique({
    where: { id: todoId },
    select: {
      id: true,
      title: true,
      creatorId: true,
      assigneeId: true,
      done: true,
    },
  });
  if (!t) return { error: "Not found", status: 404 as const };

  const isCreator = t.creatorId === userId;
  const isAssignee = t.assigneeId === userId;
  const isUnassigned = t.assigneeId === null;
  // Sichtbar: Creator, Assignee, oder unassigned (für alle).
  if (!isCreator && !isAssignee && !isUnassigned) {
    return { error: "Keine Berechtigung.", status: 403 as const };
  }
  return { t, isCreator, isAssignee };
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
  const userId = session.user.id;

  const r = await loadAndAuthorize(id, userId);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });
  const existing = r.t;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const data: Record<string, unknown> = {};
  let newAssigneeId: string | null | undefined = undefined;
  let toggledDone: { newDone: boolean } | null = null;

  // Felder, die nur der Creator ändern darf
  const creatorOnly = (msg = "Nur der Ersteller darf das ändern.") => {
    if (!r.isCreator) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return null;
  };

  if (typeof body.title === "string" && body.title.trim()) {
    const denied = creatorOnly();
    if (denied) return denied;
    data.title = body.title.trim();
  }
  if ("description" in body) {
    const denied = creatorOnly();
    if (denied) return denied;
    data.description = body.description
      ? String(body.description).trim()
      : null;
  }
  if ("priority" in body) {
    const denied = creatorOnly();
    if (denied) return denied;
    const p = Number(body.priority);
    if ([1, 2, 3].includes(p)) data.priority = p;
  }
  if ("dueDate" in body) {
    const denied = creatorOnly();
    if (denied) return denied;
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if ("targetType" in body || "targetId" in body) {
    const denied = creatorOnly();
    if (denied) return denied;
    const tt = body.targetType ? String(body.targetType).trim() : null;
    const tid = body.targetId ? String(body.targetId).trim() : null;
    data.targetType = tt && tid ? tt : null;
    data.targetId = tt && tid ? tid : null;
  }

  // Assignee-Änderung: Creator darf neu zuweisen, Assignee darf sich selbst entfernen ("Aufgabe abgeben")
  if ("assigneeId" in body) {
    const requested = body.assigneeId ? String(body.assigneeId).trim() : null;

    if (requested && requested !== existing.assigneeId) {
      if (!r.isCreator) {
        return NextResponse.json(
          { error: "Nur der Ersteller darf zuweisen." },
          { status: 403 },
        );
      }
      const target = await prisma.user.findFirst({
        where: { id: requested, isActive: true },
        select: { id: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: "Zuweisung: User nicht gefunden." },
          { status: 400 },
        );
      }
      newAssigneeId = target.id;
      data.assigneeId = target.id;
    } else if (requested === null && existing.assigneeId !== null) {
      // Zuweisung entfernen → Creator oder aktueller Assignee
      if (!r.isCreator && !r.isAssignee) {
        return NextResponse.json(
          { error: "Keine Berechtigung." },
          { status: 403 },
        );
      }
      newAssigneeId = null;
      data.assigneeId = null;
    }
  }

  // done-Toggle: Creator, Assignee, oder jeder bei unassigned (Self-Service)
  if ("done" in body) {
    const newDone = Boolean(body.done);
    if (newDone !== existing.done) {
      data.done = newDone;
      data.completedAt = newDone ? new Date() : null;
      data.completedBy = newDone ? userId : null;
      toggledDone = { newDone };
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.todo.update({ where: { id }, data });

  // Activities + Notifications
  if (newAssigneeId !== undefined && newAssigneeId !== existing.assigneeId) {
    await logTodoActivity({
      userId,
      todoId: id,
      action: "ASSIGNED",
      metadata: {
        from: existing.assigneeId,
        to: newAssigneeId,
        title: existing.title,
      },
    });
    if (newAssigneeId) {
      await notifyTodoAssignment({
        todoId: id,
        todoTitle: existing.title,
        assigneeId: newAssigneeId,
        assigningUserId: userId,
      });
    }
  }

  if (toggledDone) {
    await logTodoActivity({
      userId,
      todoId: id,
      action: toggledDone.newDone ? "CLOSED" : "REOPENED",
      metadata: { title: existing.title },
    });
    // Wenn der Assignee fertig macht → Creator informieren
    if (toggledDone.newDone) {
      await notifyTodoCompleted({
        todoId: id,
        todoTitle: existing.title,
        creatorId: existing.creatorId,
        completingUserId: userId,
      });
    }
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
  const r = await loadAndAuthorize(id, session.user.id);
  if ("error" in r)
    return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.isCreator) {
    return NextResponse.json(
      { error: "Nur der Ersteller darf löschen." },
      { status: 403 },
    );
  }
  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
