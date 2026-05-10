/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

export async function notifyTodoAssignment(params: {
  todoId: string;
  todoTitle: string;
  assigneeId: string;
  assigningUserId: string;
}) {
  const { todoId, todoTitle, assigneeId, assigningUserId } = params;
  if (assigneeId === assigningUserId) return;
  await prisma.notification.create({
    data: {
      userId: assigneeId,
      type: "ASSIGNMENT",
      title: `Dir wurde das Todo „${todoTitle}" zugewiesen`,
      targetType: "todo",
      targetId: todoId,
    },
  });
}

export async function notifyTodoCompleted(params: {
  todoId: string;
  todoTitle: string;
  creatorId: string;
  completingUserId: string;
}) {
  const { todoId, todoTitle, creatorId, completingUserId } = params;
  if (creatorId === completingUserId) return;
  await prisma.notification.create({
    data: {
      userId: creatorId,
      type: "COMMENT", // wir nutzen COMMENT für "Update"; alternativ ASSIGNMENT
      title: `Todo „${todoTitle}" wurde erledigt`,
      targetType: "todo",
      targetId: todoId,
    },
  });
}

export async function logTodoActivity(params: {
  userId: string;
  todoId: string;
  action: "CREATED" | "UPDATED" | "ASSIGNED" | "CLOSED" | "REOPENED";
  metadata?: Record<string, unknown>;
}) {
  await prisma.activity.create({
    data: {
      organizationId: null, // Todos sind nicht org-gebunden
      userId: params.userId,
      action: params.action,
      targetType: "todo",
      targetId: params.todoId,
      metadata: params.metadata as any,
    },
  });
}
