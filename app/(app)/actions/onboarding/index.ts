"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UiSettings, OnboardingStepKey } from "@/lib/types/onboarding";

const VALID_KEYS: OnboardingStepKey[] = [
  "profile",
  "preferences",
  "organization",
  "firstCase",
  "firstProtocol",
];

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

async function readUi(userId: string): Promise<UiSettings> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { uiSettings: true },
  });
  return (pref?.uiSettings ?? {}) as UiSettings;
}

async function writeUi(userId: string, ui: UiSettings) {
  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, uiSettings: ui as object },
    update: { uiSettings: ui as object },
  });
}

export async function markOnboardingStepAction(key: OnboardingStepKey) {
  if (!VALID_KEYS.includes(key)) return { ok: false };
  const userId = await requireUserId();

  const ui = await readUi(userId);
  const onb = ui.onboardingHome ?? {};
  await writeUi(userId, {
    ...ui,
    onboardingHome: {
      ...onb,
      completed: { ...(onb.completed ?? {}), [key]: true },
    },
  });

  revalidatePath("/home");
  return { ok: true };
}

export async function dismissOnboardingAction() {
  const userId = await requireUserId();
  const ui = await readUi(userId);

  await writeUi(userId, {
    ...ui,
    onboardingHome: { ...(ui.onboardingHome ?? {}), dismissed: true },
  });

  revalidatePath("/home");
  return { ok: true };
}

// Optional, falls du in Settings einen "Onboarding neu starten" Button anbieten willst
export async function resetOnboardingAction() {
  const userId = await requireUserId();
  const ui = await readUi(userId);

  await writeUi(userId, {
    ...ui,
    onboardingHome: { completed: {}, dismissed: false },
  });

  revalidatePath("/home");
  return { ok: true };
}
