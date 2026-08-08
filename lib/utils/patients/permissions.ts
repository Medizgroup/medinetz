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

type PatientRole = "VIEWER" | "COORDINATOR" | "ADMIN" | "LIMITED";

// Höchste zuerst: entscheidet, welche Rolle gilt, wenn derselbe Patient über
// mehrere Orgs erreichbar ist, in denen der User unterschiedliche Rollen hat.
const ROLE_PRIORITY: PatientRole[] = ["ADMIN", "COORDINATOR", "LIMITED", "VIEWER"];

/**
 * Prüft, ob der User auf einen Patienten zugreifen darf.
 * Zugriff erlaubt, wenn der Patient in mindestens einem Case einer Org ist,
 * in der der User Mitglied ist. Ein Patient kann über mehrere Orgs verknüpft
 * sein (z.B. Routine + Schwangerschaft) — es zählt die höchste Rolle, die der
 * User in irgendeiner dieser Orgs hat, nicht eine beliebig ausgewählte.
 */
export async function canAccessPatient(
  patientId: string,
  userId: string,
): Promise<{
  ok: boolean;
  role?: PatientRole;
}> {
  const orgIds = await getUserOrgIds(userId);
  if (orgIds.length === 0) return { ok: false };

  const casesInOrgs = await prisma.case.findMany({
    where: {
      patientId,
      organizationId: { in: orgIds },
    },
    select: { organizationId: true },
    distinct: ["organizationId"],
  });

  if (casesInOrgs.length === 0) return { ok: false };

  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      organizationId: { in: casesInOrgs.map((c) => c.organizationId) },
    },
    select: { role: true },
  });

  const bestRole = memberships
    .map((m) => m.role as PatientRole)
    .sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b))[0];

  return { ok: true, role: bestRole };
}

export function canEditPatient(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}
