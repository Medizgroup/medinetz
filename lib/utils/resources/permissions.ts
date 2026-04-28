export function canManageResources(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}

/**
 * Prüft, ob der User in IRGENDEINER seiner Orgs COORDINATOR oder ADMIN ist.
 * Resources sind instanz-weit, deshalb reicht eine erhöhte Rolle in einer Org.
 */
export async function userCanManageResources(
  userId: string,
  prisma: typeof import("@/lib/prisma").default,
): Promise<boolean> {
  const m = await prisma.organizationMember.findFirst({
    where: {
      userId,
      role: { in: ["COORDINATOR", "ADMIN"] },
    },
    select: { id: true },
  });
  return Boolean(m);
}
