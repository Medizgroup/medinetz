import prisma from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

// Rang der Org-Rollen (höher = mehr Rechte)
export const ROLE_RANK: Record<UserRole, number> = {
  LIMITED: 1,
  VIEWER: 2,
  COORDINATOR: 3,
  ADMIN: 4,
};

/** Mindestens Koordinator? */
export function isOrgManagerRole(role: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.COORDINATOR;
}

/**
 * Darf der User diese Org verwalten?
 * Instanz-Admin ODER Mitglied mit mindestens Koordinator-Rolle.
 */
export async function canManageOrg(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInstanceAdmin: true },
  });
  if (user?.isInstanceAdmin) return true;

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  return membership ? isOrgManagerRole(membership.role) : false;
}

/** Für Server Components: notFound() wenn keine Berechtigung. */
export async function requireOrgManager(
  userId: string,
  organizationId: string,
): Promise<void> {
  if (!(await canManageOrg(userId, organizationId))) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
}
