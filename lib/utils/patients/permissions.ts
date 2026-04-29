import prisma from "@/lib/prisma";

/**
 * Findet alle Org-IDs, in denen der User Mitglied ist.
 */
export async function getUserOrgIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  return memberships.map((m) => m.organizationId);
}

/**
 * Prüft, ob der User auf einen Patienten zugreifen darf.
 * Zugriff erlaubt, wenn der Patient in mindestens einem Case einer Org ist,
 * in der der User Mitglied ist.
 */
export async function canAccessPatient(
  patientId: string,
  userId: string,
): Promise<{
  ok: boolean;
  role?: "VIEWER" | "COORDINATOR" | "ADMIN" | "LIMITED";
}> {
  const orgIds = await getUserOrgIds(userId);
  if (orgIds.length === 0) return { ok: false };

  const caseInOrg = await prisma.case.findFirst({
    where: {
      patientId,
      organizationId: { in: orgIds },
    },
    select: { organizationId: true },
  });

  if (!caseInOrg) return { ok: false };

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: caseInOrg.organizationId,
        userId,
      },
    },
    select: { role: true },
  });

  return { ok: true, role: membership?.role };
}

export function canEditPatient(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}
