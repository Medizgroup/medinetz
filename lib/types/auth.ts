import { z } from "zod";

export const emailStepSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Bitte eine gültige E-Mail eingeben."),
});

export const profileStepSchema = z.object({
  firstName: z.string().trim().min(2, "Vorname zu kurz."),
  lastName: z.string().trim().min(2, "Nachname zu kurz."),
});

export const passwordStepSchema = z
  .object({
    password: z.string().min(8, "Mindestens 8 Zeichen."),
    confirmPassword: z.string().min(8, "Mindestens 8 Zeichen."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

export const fullSignUpSchema = emailStepSchema
  .merge(profileStepSchema)
  .merge(passwordStepSchema);

export type FullSignUpValues = z.infer<typeof fullSignUpSchema>;

// Update der User Profile
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Bitte Vornamen angeben.").max(80),
  lastName: z.string().trim().min(1, "Bitte Nachnamen angeben.").max(80),
  displayName: z.string().trim().min(1, "Bitte Anzeigenamen angeben.").max(80),
  avatarUrl: z
    .string()
    .trim()
    .min(1, "Ungültige Avatar-URL.")
    .nullable()
    .optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export type FormErrors = Record<string, string | string[]>;
