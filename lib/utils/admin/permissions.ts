import prisma from "@/lib/prisma";

/**
 * Prüft, ob der User Instance-Admin ist (oberhalb aller Org-Rollen).
 * Wird für /dashboard/users, /dashboard/organizations, /dashboard/finance,
 * /dashboard/resources gebraucht.
 */
export async function isInstanceAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInstanceAdmin: true },
  });
  return Boolean(u?.isInstanceAdmin);
}

/**
 * Helper für Server Components, der direkt redirectet wenn nicht Admin.
 * Nutzbar in /dashboard/users etc.
 */
export async function requireInstanceAdmin(userId: string): Promise<void> {
  const ok = await isInstanceAdmin(userId);
  if (!ok) {
    // Wir nutzen `notFound()` statt redirect, damit es kein Info-Leak gibt
    // dass diese Routen existieren. Für den User sieht's aus wie 404.
    const { notFound } = await import("next/navigation");
    notFound();
  }
}

/**
 * Für Löschaktionen auf Org-Daten (Fälle, Protokolle): Instanz-Admin darf
 * alles, sonst nur in Orgs, in denen der User ADMIN ist.
 */
export async function getDeleteScope(
  userId: string,
): Promise<{ isInstanceAdmin: boolean; adminOrgIds: string[] }> {
  const [instanceAdmin, memberships] = await Promise.all([
    isInstanceAdmin(userId),
    prisma.organizationMember.findMany({
      where: { userId, role: "ADMIN" },
      select: { organizationId: true },
    }),
  ]);
  return {
    isInstanceAdmin: instanceAdmin,
    adminOrgIds: memberships.map((m) => m.organizationId),
  };
}
