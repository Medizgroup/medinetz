"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type ActionState = {
  ok: boolean;
  errors: Record<string, string | string[]>;
  message?: string;
};

function ok(message?: string): ActionState {
  return { ok: true, errors: {}, message };
}
function bad(errors: ActionState["errors"], message?: string): ActionState {
  return { ok: false, errors, message };
}

const acceptInviteSchema = z.object({
  inviteId: z.string().min(1),
});

export async function acceptInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || !session.user.email)
    return bad({ _form: ["Unauthorized"] });

  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return bad(parsed.error.flatten().fieldErrors, "Ungültige Daten.");
  }

  const invite = await prisma.organizationInvite.findUnique({
    where: { id: parsed.data.inviteId },
    include: { organization: true },
  });

  if (!invite) return bad({ _form: ["Einladung nicht gefunden."] });
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return bad({ _form: ["Diese Einladung gehört nicht zu deiner Email."] });
  }
  if (invite.acceptedAt)
    return bad({ _form: ["Einladung wurde bereits angenommen."] });
  if (invite.expiresAt.getTime() < Date.now())
    return bad({ _form: ["Einladung ist abgelaufen."] });

  await prisma.$transaction(async (tx) => {
    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: session.user.id,
        },
      },
      update: { role: invite.role },
      create: {
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: invite.role,
        invitedBy: invite.invitedBy,
      },
    });

    await tx.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  revalidatePath("/settings/organizations");
  return ok(`Einladung angenommen: ${invite.organization.name}`);
}

const declineInviteSchema = z.object({
  inviteId: z.string().min(1),
});

export async function declineInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id || !session.user.email)
    return bad({ _form: ["Unauthorized"] });

  const parsed = declineInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return bad(parsed.error.flatten().fieldErrors, "Ungültige Daten.");
  }

  const invite = await prisma.organizationInvite.findUnique({
    where: { id: parsed.data.inviteId },
  });

  if (!invite) return bad({ _form: ["Einladung nicht gefunden."] });
  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return bad({ _form: ["Diese Einladung gehört nicht zu deiner Email."] });
  }
  if (invite.acceptedAt)
    return bad({ _form: ["Einladung wurde bereits angenommen."] });

  // “Ablehnen” = löschen
  await prisma.organizationInvite.delete({ where: { id: invite.id } });

  revalidatePath("/settings/organizations");
  return ok("Einladung abgelehnt.");
}

const joinRequestSchema = z.object({
  slug: z.string().trim().min(2, "Bitte Org-Slug angeben.").max(80),
  message: z.string().trim().max(500).optional(),
});

export async function requestJoinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return bad({ _form: ["Unauthorized"] });

  const parsed = joinRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return bad(parsed.error.flatten().fieldErrors, "Ungültige Daten.");
  }

  const org = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, name: true, isArchived: true },
  });
  if (!org) return bad({ slug: ["Organisation nicht gefunden."] });
  if (org.isArchived) return bad({ slug: ["Organisation ist archiviert."] });

  const alreadyMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: session.user.id,
      },
    },
  });
  if (alreadyMember) return bad({ slug: ["Du bist bereits Mitglied."] });

  // optional: wenn es eine offene Einladung gibt
  const existingInvite = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: org.id,
      email: session.user.email ?? "",
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (existingInvite)
    return bad({
      slug: ["Du hast bereits eine Einladung offen. Bitte nimm sie an."],
    });

  // Join Request anlegen (Model muss existieren)
  await prisma.organizationJoinRequest.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: session.user.id,
      },
    },
    update: { status: "PENDING", message: parsed.data.message || null },
    create: {
      organizationId: org.id,
      userId: session.user.id,
      message: parsed.data.message || null,
    },
  });

  revalidatePath("/settings/organizations");
  return ok(`Beitrittsanfrage gesendet an: ${org.name}`);
}
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
