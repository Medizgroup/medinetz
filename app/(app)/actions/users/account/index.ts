"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { changeEmailSchema, changePasswordSchema } from "@/lib/types/auth";

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

  const { userId } = await requireUserId();
  const h = await headers();

  try {
    await auth.api.changePassword({
      headers: h,
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    });
  } catch (err) {
    const message =
      err instanceof APIError ? err.message : "Passwort konnte nicht geändert werden.";
    return { ok: false, errors: { currentPassword: message } };
  }

  // Nach erfolgreichem (auch erzwungenem) Passwortwechsel ist die Pflicht erfüllt.
  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: false },
  });

  return ok();
}
