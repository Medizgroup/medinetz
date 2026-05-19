import prisma from "@/lib/prisma";
import type { UiSettings, OnboardingStepKey } from "@/lib/types/onboarding";

export type OnboardingStep = {
  key: OnboardingStepKey;
  isCompleted: boolean;
};

export type OnboardingStatus = {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
  dismissed: boolean;
  isAdmin: boolean;
};

export async function getOnboardingStatus(
  userId: string,
): Promise<OnboardingStatus> {
  const [user, pref, memberships, casesCount, protocolsCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isInstanceAdmin: true,
        },
      }),
      prisma.userPreference.findUnique({
        where: { userId },
        select: { uiSettings: true },
      }),
      prisma.organizationMember.findMany({
        where: { userId },
        select: {
          role: true,
          organization: { select: { slug: true } },
        },
      }),
      prisma.case.count({ where: { creatorId: userId } }),
      prisma.protocol.count({ where: { creatorId: userId } }),
    ]);

  const ui = (pref?.uiSettings ?? {}) as UiSettings;
  const onb = ui.onboardingHome ?? {};
  const completed = onb.completed ?? {};

  const isAdmin =
    Boolean(user?.isInstanceAdmin) ||
    memberships.some((m) => m.role === "ADMIN");

  // Auto-Detection: Wenn DB sagt "schon erledigt", auch ohne explizite Markierung
  const autoFlags: Record<OnboardingStepKey, boolean> = {
    profile: Boolean(user?.firstName && user?.lastName && user?.avatarUrl),
    preferences: false, // braucht explizites Save, schwer auto-detectable
    organization: isAdmin
      ? false // Admin: muss aktiv einladen oder skippen
      : memberships.some((m) => m.organization.slug !== "routine"),
    firstCase: casesCount > 0,
    firstProtocol: protocolsCount > 0,
  };

  const order: OnboardingStepKey[] = [
    "profile",
    "preferences",
    "organization",
    "firstCase",
    "firstProtocol",
  ];

  const steps = order.map((key) => ({
    key,
    isCompleted: completed[key] === true || autoFlags[key],
  }));

  const completedCount = steps.filter((s) => s.isCompleted).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    allDone: completedCount === steps.length,
    dismissed: Boolean(onb.dismissed),
    isAdmin,
  };
}
