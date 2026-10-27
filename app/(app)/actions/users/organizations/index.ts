"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionStateLeave = { ok: true } | { ok: false; error: string };

export async function leaveOrganizationAction(
  _prev: ActionStateLeave | null,
  formData: FormData,
): Promise<ActionStateLeave> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "Nicht eingeloggt." };

  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) return { ok: false, error: "Missing membershipId." };

  // Membership laden + Ownership prüfen
  const membership = await prisma.organizationMember.findUnique({
    where: { id: membershipId },
    select: {
      id: true,
      userId: true,
      organization: { select: { id: true, type: true, name: true } },
    },
  });

  if (!membership)
    return { ok: false, error: "Mitgliedschaft nicht gefunden." };
  if (membership.userId !== session.user.id)
    return { ok: false, error: "Nicht erlaubt." };

  // ROUTINE nicht verlassbar
  if (membership.organization.type === "ROUTINE") {
    return {
      ok: false,
      error: "Die ROUTINE-Organisation kannst du nicht verlassen.",
    };
  }

  await prisma.organizationMember.delete({
    where: { id: membershipId },
  });

  revalidatePath("/settings/organizations");
  return { ok: true };
}
