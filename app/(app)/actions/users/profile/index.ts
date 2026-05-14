"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ActionState, profileSchema, type FormErrors } from "@/lib/types/auth";
import {
  avatarConfigSchema,
  buildAvatarUrl,
  type AvatarConfig,
} from "@/lib/avatar/dicebear";
import { Prisma } from "@/generated/prisma/client";

function toErrors(error: z.ZodError): FormErrors {
  const { fieldErrors } = z.flattenError(error);
  return fieldErrors as FormErrors;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, errors: {}, message: "Nicht eingeloggt." };
  }

  const raw = Object.fromEntries(formData.entries());

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: toErrors(parsed.error) };
  }

  // avatarConfig kommt als JSON-String (oder "" wenn gelöscht)
  let avatarConfig: AvatarConfig | null = null;
  const rawConfig = raw.avatarConfig;
  if (typeof rawConfig === "string" && rawConfig.trim() !== "") {
    let json: unknown;
    try {
      json = JSON.parse(rawConfig);
    } catch {
      return { ok: false, errors: { avatarConfig: "Ungültige Avatar-Daten." } };
    }
    const config = avatarConfigSchema.safeParse(json);
    if (!config.success) {
      return { ok: false, errors: { avatarConfig: "Ungültige Avatar-Daten." } };
    }
    avatarConfig = config.data;
  }

  // URL immer serverseitig ableiten – Client-Wert wird nicht vertraut
  const avatarUrl = avatarConfig ? buildAvatarUrl(avatarConfig) : null;

  const { firstName, lastName, displayName } = parsed.data;
  const computedName = displayName.trim() || `${firstName} ${lastName}`.trim();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      displayName,
      name: computedName,
      avatarUrl,
      avatarConfig: avatarConfig
        ? (avatarConfig as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  });

  revalidatePath("/profile");
  return { ok: true };
}
