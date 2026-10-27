import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Todos, die ein User sieht: ihm zugewiesen, von ihm erstellt oder „für alle“. */
export function todoVisibility(userId: string): Prisma.TodoWhereInput {
  return {
    OR: [{ assigneeId: userId }, { creatorId: userId }, { assigneeId: null }],
  };
}

/**
 * Eigene Todos darf jeder löschen. Alle (sichtbaren) Todos dürfen
 * Koordinator:innen/Admins einer Org und der Instanz-Admin löschen.
 */
export async function canDeleteAllTodos(userId: string): Promise<boolean> {
  const [user, managerMembership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstanceAdmin: true },
    }),
    prisma.organizationMember.findFirst({
      where: { userId, role: { in: ["COORDINATOR", "ADMIN"] } },
      select: { id: true },
    }),
  ]);
  return Boolean(user?.isInstanceAdmin || managerMembership);
}
