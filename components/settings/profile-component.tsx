"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { LoreleiAvatarDialog } from "@/components/avatar/lorelei-avatar-dialog";

const schema = z.object({
  firstName: z.string().trim().min(1, "Bitte Vornamen angeben.").max(80),
  lastName: z.string().trim().min(1, "Bitte Nachnamen angeben.").max(80),
  // speichern wir als URL oder data-uri (beides ok)
  avatarUrl: z.string().min(1).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [userMeta, setUserMeta] = React.useState<{
    id: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
    name?: string | null;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      avatarUrl: null,
    },
    mode: "onSubmit",
  });

  const avatarUrl = form.watch("avatarUrl");

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();

      if (!mounted) return;

      const u = data.user;
      setUserMeta({
        id: u.id,
        email: u.email,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        name: u.name,
      });

      form.reset({
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        avatarUrl: u.avatarUrl ?? null,
      });

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: values.firstName,
        lastName: values.lastName,
        avatarUrl: values.avatarUrl,
        // optional: name automatisch aus first+last
        name: `${values.firstName} ${values.lastName}`.trim(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      // du kannst hier FieldError/Toast anschließen
      alert("Speichern fehlgeschlagen.");
      return;
    }

    alert("Profil gespeichert ");
  }

  if (loading) {
    return <div className="p-10">Lade Profil…</div>;
  }

  if (!userMeta) {
    return <div className="p-10">Nicht eingeloggt.</div>;
  }

  return (
    <div className="flex items-center justify-center p-10">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-5xl">
        <Separator className="my-8" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-balance font-semibold text-foreground">
              Personal information
            </h2>
            <p className="text-pretty mt-1 text-sm leading-6 text-muted-foreground">
              Bearbeite deine persönlichen Daten und dein Profilbild.
            </p>
          </div>

          <div className="sm:max-w-3xl md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="col-span-full sm:col-span-3">
                <Field className="gap-2">
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="Emma"
                    disabled={saving}
                    {...form.register("firstName")}
                  />
                  <p className="text-xs text-red-500">
                    {form.formState.errors.firstName?.message}
                  </p>
                </Field>
              </div>

              <div className="col-span-full sm:col-span-3">
                <Field className="gap-2">
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="Crown"
                    disabled={saving}
                    {...form.register("lastName")}
                  />
                  <p className="text-xs text-red-500">
                    {form.formState.errors.lastName?.message}
                  </p>
                </Field>
              </div>

              <div className="col-span-full">
                <Field className="gap-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" value={userMeta.email} disabled readOnly />
                  <FieldDescription>
                    Email kann nicht geändert werden.
                  </FieldDescription>
                </Field>
              </div>

              <div className="col-span-full sm:col-span-3">
                <Field className="gap-2">
                  <FieldLabel>Status</FieldLabel>
                  <Input
                    value={userMeta.isActive ? "Aktiv" : "Inaktiv"}
                    disabled
                    readOnly
                  />
                  <FieldDescription>
                    Accounts müssen ggf. von einem Admin freigeschaltet werden.
                  </FieldDescription>
                </Field>
              </div>

              <div className="col-span-full sm:col-span-3">
                <Field className="gap-2">
                  <FieldLabel>Email verifiziert</FieldLabel>
                  <Input
                    value={userMeta.emailVerified ? "Ja" : "Nein"}
                    disabled
                    readOnly
                  />
                </Field>
              </div>

              <div className="col-span-full">
                <Field className="gap-2">
                  <FieldLabel>Profilbild</FieldLabel>

                  <div className="flex items-center gap-4">
                    <div className="size-16 overflow-hidden rounded-2xl border">
                      {/* fallback: wenn leer, kann dicebear später default setzen */}
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="Avatar" className="size-16" />
                      ) : (
                        <div className="size-16 bg-muted" />
                      )}
                    </div>

                    <LoreleiAvatarDialog
                      seed={userMeta.id}
                      value={avatarUrl}
                      onPick={(url) =>
                        form.setValue("avatarUrl", url, { shouldDirty: true })
                      }
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saving}
                      onClick={() =>
                        form.setValue("avatarUrl", null, { shouldDirty: true })
                      }>
                      Entfernen
                    </Button>
                  </div>

                  <FieldDescription>
                    Avatar wird mit DiceBear (Lorelei Neutral) erstellt.
                  </FieldDescription>
                </Field>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" className="whitespace-nowrap">
            Go back
          </Button>
          <Button type="submit" className="whitespace-nowrap" disabled={saving}>
            {saving ? "Speichere…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
