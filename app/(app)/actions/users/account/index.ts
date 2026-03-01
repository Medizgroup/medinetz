"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  changeEmailSchema,
  changePasswordSchema,
  settingsSchema,
} from "@/lib/types/auth";

type Errors = Record<string, string | string[]>;
type ActionResult = { ok: boolean; errors: Errors };

function ok(): ActionResult {
  return { ok: true, errors: {} };
}

function zodErrors(error: z.ZodError): ActionResult {
  const { fieldErrors } = error.flatten();
  return { ok: false, errors: fieldErrors as Errors };
}

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return { userId, session };
}

// ---------- Actions ----------
export async function changeEmailAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = changeEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { userId } = await requireUserId();
  await prisma.user.update({
    where: { id: userId },
    data: { email: parsed.data.email },
  });

  return ok();
}

export async function changePasswordAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  // TODO: Better Auth Password Change API einbauen
  // await auth.api.changePassword({ headers: await headers(), body: {...} })

  return {
    ok: false,
    errors: { newPassword: "Better Auth changePassword noch nicht eingebaut." },
  };
}

export async function accountSettingsAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse({
    emailNotifications: formData.get("emailNotifications"),
    timezone: formData.get("timezone"),
    language: formData.get("language"),
  });
  if (!parsed.success) return zodErrors(parsed.error);

  const { userId } = await requireUserId();

  await prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailNotifications: parsed.data.emailNotifications ?? true,
      timezone: parsed.data.timezone ?? "Europe/Berlin",
      language: parsed.data.language ?? "de",
    },
    update: {
      emailNotifications:
        parsed.data.emailNotifications === undefined
          ? undefined
          : parsed.data.emailNotifications,
      timezone: parsed.data.timezone ?? undefined,
      language: parsed.data.language ?? undefined,
    },
  });

  return ok();
}
