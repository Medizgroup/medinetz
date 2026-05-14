"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";

type Step = "email" | "profile" | "password";
type Errors = Record<string, string | string[]>;

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Bitte eine gültige E-Mail eingeben."),
});

const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Der Vorname muss mindestens 2 Zeichen lang sein."),
  lastName: z
    .string()
    .trim()
    .min(2, "Der Nachname muss mindestens 2 Zeichen lang sein."),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Mindestens 8 Zeichen."),
    confirmPassword: z.string().min(8, "Mindestens 8 Zeichen."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  });

function flattenZodErrors(err: z.ZodError): Errors {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const fieldErrors: Record<string, string[] | undefined> =
    typeof anyErr.flatten === "function"
      ? anyErr.flatten().fieldErrors
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (z as any).flattenError(err).fieldErrors;

  const out: Errors = {};
  for (const [k, v] of Object.entries(fieldErrors)) {
    if (v && v.length) out[k] = v;
  }
  return out;
}

async function checkEmailExists(email: string) {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "E-Mail Prüfung fehlgeschlagen.");
  }

  return Boolean(data?.exists);
}

export default function SignUpPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Wir behalten die Werte zwischen Steps (weil Felder verschwinden)
  const [draft, setDraft] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  const subtitle = useMemo(() => {
    if (step === "email") return "Gib eine gültige E-Mail-Adresse ein.";

    if (step === "profile") return "Wie sollen wir dich ansprechen?";
    return "Lege ein Passwort fest.";
  }, [step]);

  const onSubmit = async (event: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    event.preventDefault();
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());

    // Step-spezifische Daten aus dem Form (plus Draft als Fallback)
    const nextDraft = {
      ...draft,
      email: String(values.email ?? draft.email ?? ""),
      firstName: String(values.firstName ?? draft.firstName ?? ""),
      lastName: String(values.lastName ?? draft.lastName ?? ""),
      password: String(values.password ?? draft.password ?? ""),
      confirmPassword: String(
        values.confirmPassword ?? draft.confirmPassword ?? "",
      ),
    };

    setLoading(true);

    try {
      if (step === "email") {
        const parsed = emailSchema.safeParse({ email: nextDraft.email });
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }

        // Email check (UX)
        const exists = await checkEmailExists(parsed.data.email);
        if (exists) {
          setErrors({
            email: "Diese E-Mail ist bereits registriert. Bitte anmelden.",
          });
          return;
        }

        setErrors({});
        setDraft((d) => ({ ...d, email: parsed.data.email }));
        setStep("profile");
        return;
      }

      if (step === "profile") {
        const parsed = profileSchema.safeParse({
          firstName: nextDraft.firstName,
          lastName: nextDraft.lastName,
        });
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }

        setErrors({});
        setDraft((d) => ({ ...d, ...parsed.data }));
        setStep("password");
        return;
      }

      // step === "password"
      const parsed = passwordSchema.safeParse({
        password: nextDraft.password,
        confirmPassword: nextDraft.confirmPassword,
      });
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return;
      }

      setErrors({});
      setDraft((d) => ({ ...d, ...parsed.data }));

      // Account erstellen + Login via Better Auth
      const fullName = `${nextDraft.firstName} ${nextDraft.lastName}`.trim();

      const res = await signUp.email({
        email: nextDraft.email.trim().toLowerCase(),
        password: parsed.data.password,
        name: fullName ?? "",
      });

      if (res?.error) {
        setServerError(res.error.message || "Registrierung fehlgeschlagen.");
        return;
      }

      toastManager.add({
        title: "Willkommen!",
        description: "Dein Konto wurde erfolgreich erstellt.",
        type: "success",
      });

      router.replace("/home");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-dvh px-4">
      <Card className="w-full max-w-sm rounded-4xl px-6 py-10 pt-14">
        <CardContent>
          <Form onSubmit={onSubmit} errors={errors}>
            <div className="flex flex-col items-center space-y-8">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center">
                  <Image
                    src="/Logo/logo-light.svg"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="inline dark:hidden"
                  />
                  <Image
                    src="/Logo/logo-dark.svg"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="hidden dark:inline"
                  />
                </div>
                <h1 className="text-balance text-3xl font-semibold text-foreground">
                  Ein Konto erstellen
                </h1>
                <p className="text-pretty text-foreground/80 text-sm">
                  {subtitle}
                </p>
              </div>

              {serverError && (
                <p className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <div className="w-full space-y-4">
                {step === "email" && (
                  <Field name="email">
                    <FieldLabel>E-Mail</FieldLabel>
                    <Input
                      name="email"
                      type="email"
                      size="lg"
                      className="w-full rounded-xl"
                      defaultValue={draft.email}
                      disabled={loading}
                      autoComplete="email"
                    />
                    <FieldError />
                  </Field>
                )}

                {step === "profile" && (
                  <>
                    <Field name="firstName">
                      <FieldLabel>Vorname</FieldLabel>
                      <Input
                        name="firstName"
                        size="lg"
                        className="w-full rounded-xl"
                        defaultValue={draft.firstName}
                        disabled={loading}
                        autoComplete="given-name"
                      />
                      <FieldError />
                    </Field>

                    <Field name="lastName">
                      <FieldLabel>Nachname</FieldLabel>
                      <Input
                        name="lastName"
                        size="lg"
                        className="w-full rounded-xl"
                        defaultValue={draft.lastName}
                        disabled={loading}
                        autoComplete="family-name"
                      />
                      <FieldError />
                    </Field>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-xl bg-accent"
                      size="lg"
                      disabled={loading}
                      onClick={() => {
                        setErrors({});
                        setServerError(null);
                        setStep("email");
                      }}>
                      Zurück
                    </Button>
                  </>
                )}

                {step === "password" && (
                  <>
                    <Field name="password">
                      <FieldLabel>Passwort</FieldLabel>
                      <Input
                        name="password"
                        type="password"
                        size="lg"
                        className="w-full rounded-xl"
                        defaultValue={draft.password}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <FieldError />
                    </Field>

                    <Field name="confirmPassword">
                      <FieldLabel>Passwort bestätigen</FieldLabel>
                      <Input
                        name="confirmPassword"
                        type="password"
                        size="lg"
                        className="w-full rounded-xl"
                        defaultValue={draft.confirmPassword}
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <FieldError />
                    </Field>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-xl"
                      size="lg"
                      disabled={loading}
                      onClick={() => {
                        setErrors({});
                        setServerError(null);
                        setStep("profile");
                      }}>
                      Zurück
                    </Button>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  size="lg"
                  disabled={loading}>
                  {step === "password" ? (
                    loading ? (
                      <>
                        <Spinner /> Loading...
                      </>
                    ) : (
                      "Konto erstellen"
                    )
                  ) : loading ? (
                    <>
                      <Spinner /> Loading...
                    </>
                  ) : (
                    "Weiter"
                  )}
                </Button>

                {step === "email" && (
                  <>
                    <div className="flex items-center gap-4 py-2">
                      <Separator className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        ODER
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      size="lg"
                      disabled={loading}
                      onClick={() => router.push("/sign-in")}>
                      Anmelden
                    </Button>
                  </>
                )}
              </div>

              {step === "email" && (
                <p className="text-pretty text-center text-xs w-11/12 text-muted-foreground">
                  Bei Fortfahren erklärst du dich mit unseren{" "}
                  <a href="#" className="underline hover:text-foreground">
                    Nutzungsbedingungen
                  </a>{" "}
                  und unseren{" "}
                  <a href="#" className="underline hover:text-foreground">
                    Datenschutzbestimmungen
                  </a>
                  .
                </p>
              )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
