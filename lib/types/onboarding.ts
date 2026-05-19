export type OnboardingStepKey =
  | "profile"
  | "preferences"
  | "organization"
  | "firstCase"
  | "firstProtocol";

export type OnboardingHomeState = {
  completed?: Partial<Record<OnboardingStepKey, boolean>>;
  dismissed?: boolean;
};

export type UiSettings = {
  onboardingHome?: OnboardingHomeState;
  // Platz für zukünftige UI-Settings (theme, compact, etc.)
};
