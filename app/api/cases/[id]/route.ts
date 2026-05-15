/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canEditCase } from "@/lib/utils/cases";
import type { CasePriority, CaseStatus } from "@/generated/prisma/client";

const PRIORITY_VALUES: CasePriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUS_VALUES: CaseStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "CLOSED",
];

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

  const existing = await prisma.case.findUnique({
    where: { id },
    select: {
      id: true,
      organizationId: true,
      creatorId: true,
      status: true,
      assigneeId: true,
      title: true,
      caseNumber: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: existing.organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (
    !membership ||
    !canEditCase(membership.role, existing.creatorId === session.user.id)
  ) {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  // Build update payload aus den Feldern, die im Body kommen
  const data: Record<string, unknown> = {};
  const activities: { action: string; metadata: Record<string, unknown> }[] =
    [];

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length === 0) {
      return NextResponse.json(
        { error: "Titel darf nicht leer sein." },
        { status: 400 },
      );
    }
    data.title = t;
  }

  if ("description" in body) {
    data.description = body.description
      ? String(body.description).trim()
      : null;
  }

  if ("priority" in body && PRIORITY_VALUES.includes(body.priority)) {
    data.priority = body.priority;
  }

  if ("sensitivityLevel" in body) {
    const n = Number(body.sensitivityLevel);
    if ([1, 2, 3].includes(n)) data.sensitivityLevel = n;
  }

  if ("dueDate" in body) {
    data.dueDate = body.dueDate ? new Date(String(body.dueDate)) : null;
  }

  if ("estimatedCosts" in body) {
    if (body.estimatedCosts === null || body.estimatedCosts === "") {
      data.estimatedCosts = null;
    } else {
      const n = Number(body.estimatedCosts);
      if (!Number.isNaN(n)) data.estimatedCosts = n;
    }
  }

  // Status-Transition
  if ("status" in body && STATUS_VALUES.includes(body.status)) {
    const newStatus = body.status as CaseStatus;
    if (newStatus !== existing.status) {
      data.status = newStatus;

      if (newStatus === "CLOSED") {
        data.closedAt = new Date();
        data.closedBy = session.user.id;
        activities.push({
          action: "CLOSED",
          metadata: {
            caseNumber: existing.caseNumber,
            title: existing.title,
            from: existing.status,
            to: newStatus,
          },
        });
      } else if (existing.status === "CLOSED") {
        data.closedAt = null;
        data.closedBy = null;
        activities.push({
          action: "REOPENED",
          metadata: {
            caseNumber: existing.caseNumber,
            title: existing.title,
            from: existing.status,
            to: newStatus,
          },
        });
      } else {
        activities.push({
          action: "UPDATED",
          metadata: {
            caseNumber: existing.caseNumber,
            field: "status",
            from: existing.status,
            to: newStatus,
          },
        });
      }
    }
  }

  // Assignee-Änderung (ERSETZEN)
  let notifyAssigneeId: string | null = null;
  if ("assigneeId" in body) {
    const newAssigneeId = body.assigneeId ? String(body.assigneeId) : null;

    if (newAssigneeId !== existing.assigneeId) {
      if (newAssigneeId) {
        const m = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: existing.organizationId,
              userId: newAssigneeId,
            },
          },
          select: { id: true },
        });

        if (!m) {
          return NextResponse.json(
            { error: "Zugewiesener User ist nicht Mitglied der Organisation." },
            { status: 400 },
          );
        }
      }

      // Namen für die Activity-Anzeige holen
      const userIds = [existing.assigneeId, newAssigneeId].filter(
        (x): x is string => Boolean(x),
      );
      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: {
                id: true,
                displayName: true,
                name: true,
                email: true,
              },
            })
          : [];

      const nameOf = (uid: string | null) => {
        if (!uid) return null;
        const u = users.find((x) => x.id === uid);
        if (!u) return null;
        return u.displayName || u.name || u.email;
      };

      data.assigneeId = newAssigneeId;
      activities.push({
        action: "ASSIGNED",
        metadata: {
          caseNumber: existing.caseNumber,
          title: existing.title,
          from: existing.assigneeId,
          to: newAssigneeId,
          fromUserName: nameOf(existing.assigneeId),
          toUserName: nameOf(newAssigneeId),
        },
      });

      if (newAssigneeId && newAssigneeId !== session.user.id) {
        notifyAssigneeId = newAssigneeId;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  await prisma.case.update({
    where: { id },
    data,
  });

  // Activity-Einträge schreiben
  if (activities.length === 0) {
    activities.push({
      action: "UPDATED",
      metadata: {
        caseNumber: existing.caseNumber,
        title: existing.title,
        fields: Object.keys(data),
      },
    });
  }

  await prisma.activity.createMany({
    data: activities.map((a) => ({
      organizationId: existing.organizationId,
      userId: session.user.id,
      action: a.action as
        | "CREATED"
        | "UPDATED"
        | "ASSIGNED"
        | "CLOSED"
        | "REOPENED",
      targetType: "case",
      targetId: id,
      metadata: a.metadata as any,
    })),
  });

  // Notification beim Assigning
  if (notifyAssigneeId) {
    await prisma.notification.create({
      data: {
        userId: notifyAssigneeId,
        type: "ASSIGNMENT",
        title: `Dir wurde Fall „${existing.title}" zugewiesen`,
        targetType: "case",
        targetId: id,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
