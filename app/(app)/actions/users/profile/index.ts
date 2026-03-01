// app/(app)/profile/actions.ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ActionState, profileSchema, type FormErrors } from "@/lib/types/auth";

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

  // FormData -> Object
  const raw = Object.fromEntries(formData.entries());

  // avatarUrl kann "" sein (wenn gelöscht). Wir normalisieren zu null.
  const normalized = {
    ...raw,
    avatarUrl:
      raw.avatarUrl === "" || raw.avatarUrl === undefined
        ? null
        : raw.avatarUrl,
  };

  const parsed = profileSchema.safeParse(normalized);
  if (!parsed.success) {
    return { ok: false, errors: toErrors(parsed.error) };
  }

  const { firstName, lastName, displayName, avatarUrl } = parsed.data;
  const computedName = displayName.trim() || `${firstName} ${lastName}`.trim();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      displayName,
      avatarUrl: avatarUrl ?? null,
      name: computedName,
    },
  });

  revalidatePath("/profile");
  return { ok: true };
}
