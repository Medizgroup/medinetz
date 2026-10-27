import prisma from "@/lib/prisma";

/**
 * Darf der User die Mitglieder dieser Org verwalten (hinzufügen, Rolle
 * ändern, entfernen)? Instanz-Admin überall, sonst nur ADMIN der Org.
 */
export async function canManageOrgMembers(
  userId: string,
  organizationId: string,
): Promise<{ allowed: boolean; isInstanceAdmin: boolean }> {
  const [user, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isInstanceAdmin: true },
    }),
    prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { role: true },
    }),
  ]);
  const isInstanceAdmin = Boolean(user?.isInstanceAdmin);
  return {
    allowed: isInstanceAdmin || membership?.role === "ADMIN",
    isInstanceAdmin,
  };
}
