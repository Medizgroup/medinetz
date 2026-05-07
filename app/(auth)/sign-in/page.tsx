"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { CircleAlertIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
type Step = "email" | "password";
type Errors = Record<string, string | string[]>;

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Bitte eine gültige E-Mail eingeben."),
});

const passwordSchema = z.object({
  password: z.string().min(1, "Bitte Passwort eingeben."),
});

function flattenZodErrors(err: z.ZodError): Errors {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const fieldErrors: Record<string, string[] | undefined> =
    typeof anyErr.flatten === "function"
      ? anyErr.flatten().fieldErrors
      : (z as unknown as typeof z).flattenError(err).fieldErrors;

  const out: Errors = {};
  for (const [k, v] of Object.entries(fieldErrors)) {
    if (v && v.length) out[k] = v;
  }
  return out;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export default function SignInPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    email: "",
    password: "",
  });

  const subtitle = useMemo(() => {
    if (step === "email") return "Gib deine E-Mail ein, um sich anzumelden.";
    return "Gib dein Passwort ein.";
  }, [step]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());

    const nextDraft = {
      ...draft,
      email: String(values.email ?? draft.email ?? ""),
      password: String(values.password ?? draft.password ?? ""),
    };

    setLoading(true);

    try {
      if (step === "email") {
        const parsed = emailSchema.safeParse({ email: nextDraft.email });
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }

        const email = normalizeEmail(parsed.data.email);
        const exists = await checkEmailExists(email);

        if (!exists) {
          setErrors({ email: "Kein Konto mit dieser E-Mail gefunden." });
          return;
        }

        setErrors({});
        setDraft((d) => ({ ...d, email }));
        setStep("password");
        return;
      }

      // step === "password"
      const parsedPw = passwordSchema.safeParse({
        password: nextDraft.password,
      });
      if (!parsedPw.success) {
        setErrors(flattenZodErrors(parsedPw.error));
        return;
      }

      setErrors({});
      setDraft((d) => ({ ...d, password: nextDraft.password }));

      const res = await signIn.email({
        email: normalizeEmail(nextDraft.email),
        password: nextDraft.password,
      });

      if (res?.error) {
        // typischerweise: falsches Passwort
        setServerError(res.error.message || "Anmeldung fehlgeschlagen.");
        return;
      }

      router.replace("/home");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {serverError && (
        <div className="flex items-center justify-center max-w-5xl px-4 mx-auto pt-8 fixed top-0 left-0 right-0 z-50">
          <Alert variant="error">
            <CircleAlertIcon />
            <AlertTitle>Ein Fehler ist aufgetreten!</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
            <AlertAction>
              <Button
                onClick={() => setServerError(null)}
                size="xs"
                variant="ghost">
                Schließen
              </Button>
              <Button onClick={() => setServerError(null)} size="xs">
                Ok
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}
      <div className="flex items-center justify-center min-h-dvh px-4">
        <Card className="w-full max-w-sm rounded-4xl px-6 py-10 pt-14">
          <CardContent>
            <Form onSubmit={onSubmit} errors={errors}>
              <div className="flex flex-col items-center space-y-8">
                <div className="space-y-2 text-center">
                  <div>
                    <Image
                      src="/Logo/logo-light.svg"
                      alt="Logo"
                      className="dark:hidden"
                      width={90}
                      height={90}
                    />
                    <Image
                      src="/Logo/logo-dark.svg"
                      alt="Logo Text"
                      className="hidden dark:inline "
                      width={90}
                      height={90}
                    />
                  </div>
                  <h1 className="text-balance text-3xl font-semibold text-foreground">
                    Willkommen zurück!
                  </h1>
                  <p className="text-pretty text-muted-foreground text-sm">
                    {subtitle}
                  </p>
                </div>

                <div className="w-full space-y-4">
                  {step === "email" && (
                    <Field name="email">
                      <FieldLabel>E-Mail</FieldLabel>
                      <Input
                        name="email"
                        type="email"
                        size="lg"
                        placeholder=""
                        className="w-full rounded-xl"
                        defaultValue={draft.email}
                        disabled={loading}
                        autoComplete="email"
                      />
                      <FieldError />
                    </Field>
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
                        "Anmelden"
                      )
                    ) : loading ? (
                      <>
                        <Spinner /> Prüfen...
                      </>
                    ) : (
                      "Fortfahren"
                    )}
                  </Button>

                  {step === "email" && (
                    <>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-sm text-muted-foreground"
                        disabled={loading}
                        onClick={() => router.push("/sign-up")}>
                        Noch kein Konto? Registrieren
                      </Button>

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
                        onClick={() => router.push("/sign-up")}>
                        Konto erstellen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
