import prisma from "@/lib/prisma";
import { canEditCase as canEditCaseRole, canViewCase } from "./index"; // dein bestehender Export

/**
 * Prüft, ob ein User einen Case bearbeiten darf.
 */
export async function canUserEditCase(
  caseId: string,
  userId: string,
): Promise<boolean> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { organizationId: true, creatorId: true },
  });
  if (!c) return false;

  const m = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: c.organizationId,
        userId,
      },
    },
    select: { role: true },
  });

  return canEditCaseRole(m?.role, c.creatorId === userId);
}

/**
 * Prüft, ob ein User einen Case sehen darf (Mitgliedschaft in der Org reicht).
 */
export async function canUserViewCase(
  caseId: string,
  userId: string,
): Promise<boolean> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { organizationId: true },
  });
  if (!c) return false;

  const m = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: c.organizationId,
        userId,
      },
    },
    select: { role: true },
  });

  return canViewCase(m?.role);
}
