"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageOrg } from "@/lib/utils/organizations/permissions";

type ActionState = {
  ok: boolean;
  errors: Record<string, string | string[]>;
  message?: string;
};

const ok = (message?: string): ActionState => ({
  ok: true,
  errors: {},
  message,
});
const bad = (errors: ActionState["errors"], message?: string): ActionState => ({
  ok: false,
  errors,
  message,
});

const decideSchema = z.object({
  requestId: z.string().min(1),
  organizationId: z.string().min(1),
});

async function loadContext(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false as const, error: bad({ _form: ["Nicht eingeloggt."] }) };
  }

  const parsed = decideSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false as const,
      error: bad(parsed.error.flatten().fieldErrors, "Ungültige Daten."),
    };
  }

  const { requestId, organizationId } = parsed.data;

  if (!(await canManageOrg(session.user.id, organizationId))) {
    return {
      ok: false as const,
      error: bad({ _form: ["Keine Berechtigung."] }),
    };
  }

  const request = await prisma.organizationJoinRequest.findUnique({
    where: { id: requestId },
    include: { organization: { select: { id: true, name: true } } },
  });

  if (!request || request.organizationId !== organizationId) {
    return {
      ok: false as const,
      error: bad({ _form: ["Anfrage nicht gefunden."] }),
    };
  }
  if (request.status !== "PENDING") {
    return {
      ok: false as const,
      error: bad({ _form: ["Anfrage wurde bereits bearbeitet."] }),
    };
  }

  return { ok: true as const, userId: session.user.id, request };
}

export async function approveJoinRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await loadContext(formData);
  if (!ctx.ok) return ctx.error;
  const { userId, request } = ctx;

  await prisma.$transaction(async (tx) => {
    await tx.organizationJoinRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", decidedBy: userId, decidedAt: new Date() },
    });

    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: request.organizationId,
          userId: request.userId,
        },
      },
      update: {},
      create: {
        organizationId: request.organizationId,
        userId: request.userId,
        role: "VIEWER", // Standardrolle für beigetretene Mitglieder
      },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        type: "ORGANIZATION",
        title: "Beitrittsanfrage angenommen",
        message: `Du bist jetzt Mitglied von ${request.organization.name}.`,
        targetType: "organization",
        targetId: request.organizationId,
      },
    });
  });

  revalidatePath(
    `/dashboard/organizations/${request.organizationId}/invitations`,
  );
  return ok("Anfrage angenommen.");
}

export async function rejectJoinRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await loadContext(formData);
  if (!ctx.ok) return ctx.error;
  const { userId, request } = ctx;

  await prisma.$transaction(async (tx) => {
    await tx.organizationJoinRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", decidedBy: userId, decidedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        userId: request.userId,
        type: "ORGANIZATION",
        title: "Beitrittsanfrage abgelehnt",
        message: `Deine Anfrage für ${request.organization.name} wurde abgelehnt.`,
        targetType: "organization",
        targetId: request.organizationId,
      },
    });
  });

  revalidatePath(
    `/dashboard/organizations/${request.organizationId}/invitations`,
  );
  return ok("Anfrage abgelehnt.");
}
