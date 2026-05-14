import { z } from "zod";

export const DICEBEAR_BASE =
  process.env.NEXT_PUBLIC_DICEBEAR_BASE ?? "https://api.dicebear.com/9.x";
export const AVATAR_STYLE = "lorelei";

export const EYES = Array.from(
  { length: 24 },
  (_, i) => `variant${String(i + 1).padStart(2, "0")}`,
);
export const HAIR = Array.from(
  { length: 48 },
  (_, i) => `variant${String(i + 1).padStart(2, "0")}`,
);
export const HEAD = ["variant01", "variant02", "variant03", "variant04"];
export const NOSE = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
  "variant06",
];
export const MOUTH = [
  ...Array.from(
    { length: 18 },
    (_, i) => `happy${String(i + 1).padStart(2, "0")}`,
  ),
  ...Array.from(
    { length: 9 },
    (_, i) => `sad${String(i + 1).padStart(2, "0")}`,
  ),
];
export const GLASSES = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
];
export const BEARD = ["variant01", "variant02"];
export const EARRINGS = ["variant01", "variant02", "variant03"];
export const FRECKLES = ["variant01"];
export const HAIRACCESSORIES = ["flowers"];
export const BG = [
  "ffffff",
  "f5f5f5",
  "0a0a0a",
  "dc2626",
  "f97316",
  "d97706",
  "ca8a04",
  "65a30d",
  "16a34a",
  "059669",
  "0d9488",
  "0891b2",
  "0284c7",
  "2563eb",
  "4f46e5",
  "7c3aed",
  "9333ea",
  "c026d3",
  "db2777",
  "e11d48",
];

const oneOf = (list: readonly string[], allowNone = false) =>
  z
    .string()
    .refine(
      (v) => list.includes(v) || (allowNone && v === "none"),
      "Ungültiger Wert.",
    );

export const avatarConfigSchema = z.object({
  seed: z.string().trim().min(1).max(200),
  backgroundColor: oneOf(BG),
  head: oneOf(HEAD),
  hair: oneOf(HAIR),
  eyes: oneOf(EYES),
  nose: oneOf(NOSE),
  mouth: oneOf(MOUTH),
  hairAccessories: oneOf(HAIRACCESSORIES, true),
  freckles: oneOf(FRECKLES, true),
  glasses: oneOf(GLASSES, true),
  beard: oneOf(BEARD, true),
  earrings: oneOf(EARRINGS, true),
});

export type AvatarConfig = z.infer<typeof avatarConfigSchema>;

export function defaultAvatarConfig(seed: string): AvatarConfig {
  return {
    seed,
    backgroundColor: BG[0],
    head: HEAD[0],
    hair: HAIR[0],
    eyes: EYES[0],
    nose: NOSE[0],
    mouth: MOUTH[0],
    hairAccessories: "none",
    freckles: "none",
    glasses: "none",
    beard: "none",
    earrings: "none",
  };
}

export function buildAvatarUrl(config: AvatarConfig): string {
  const p = new URLSearchParams();
  p.set("seed", config.seed);
  p.set("radius", "20");
  p.set("backgroundColor", config.backgroundColor);
  p.set("head", config.head);
  p.set("hair", config.hair);
  p.set("eyes", config.eyes);
  p.set("nose", config.nose);
  p.set("mouth", config.mouth);

  const optional: [keyof AvatarConfig, string][] = [
    ["hairAccessories", "hairAccessoriesProbability"],
    ["freckles", "frecklesProbability"],
    ["glasses", "glassesProbability"],
    ["beard", "beardProbability"],
    ["earrings", "earringsProbability"],
  ];
  for (const [key, probKey] of optional) {
    const value = config[key];
    if (value && value !== "none") {
      p.set(key, value);
      p.set(probKey, "100");
    } else {
      p.set(probKey, "0");
    }
  }
  return `${DICEBEAR_BASE}/${AVATAR_STYLE}/svg?${p.toString()}`;
}
