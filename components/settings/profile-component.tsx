// app/(app)/profile/profile-form.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { LoreleiAvatarDialog } from "@/components/avatar/lorelei-avatar-dialog";
import { updateProfileAction } from "@/app/(app)/actions/users/profile";
import { toastManager } from "../ui/toast";

type UserDTO = {
  id: string;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

type ActionState =
  | { ok: true }
  | { ok: false; errors: Record<string, string | string[]>; message?: string };

const initialState: ActionState = { ok: false, errors: {} };

export default function ProfileForm({ user }: { user: UserDTO }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    user.avatarUrl,
  );

  // Optional: Success Toast/Message
  React.useEffect(() => {
    if (state.ok) {
      toastManager.add({
        description: "Deine Änderungen wurden gespeichert.",
        title: "Success!",
        type: "success",
      });
    }
  }, [state.ok]);

  return (
    <>
      <div className="px-10">
        <h3 className="text-2xl font-semibold">Profil</h3>
      </div>

      <div className="flex items-center justify-center p-10">
        <Form
          action={formAction}
          errors={!state.ok ? state.errors : {}}
          className="w-full max-w-7xl">
          <input type="hidden" name="avatarUrl" value={avatarUrl ?? ""} />

          {/* AVATAR */}
          <div className="grid grid-cols-1">
            <div>
              <h2 className="text-balance text-xl font-semibold text-foreground">
                Avatar
              </h2>
              <p className="text-pretty my-1 text-sm leading-6 text-muted-foreground">
                Du kannst dein Avatar bearbeiten oder entfernen.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                <div className="size-20 sm:size-44 overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="size-20 sm:size-44"
                    />
                  ) : (
                    <div className="size-20 sm:size-44 bg-muted rounded-3xl" />
                  )}
                </div>

                <div className="flex sm:flex-row flex-col gap-4">
                  <LoreleiAvatarDialog
                    seed={user.name ?? user.id}
                    value={avatarUrl}
                    onPick={(url) => setAvatarUrl(url)}
                  />

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="destructive-outline"
                      disabled={pending}
                      className="rounded-full"
                      onClick={() => setAvatarUrl(null)}>
                      Avatar löschen
                    </Button>
                  )}
                </div>
              </div>

              {/* optional global errors */}
              {state.ok === false && state.message ? (
                <p className="mt-2 text-sm text-red-500">{state.message}</p>
              ) : null}
            </div>
          </div>

          <Separator className="my-8" />

          {/* DISPLAY NAME */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-balance font-semibold text-foreground">
                Anzeige Name
              </h2>
              <p className="text-pretty mt-1 text-sm leading-6 text-muted-foreground">
                Das ist dein öffentlicher Name in der App.
              </p>
            </div>

            <div className="sm:max-w-3xl md:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div className="col-span-full">
                  <Field name="displayName" className="gap-2">
                    <FieldLabel htmlFor="displayName">Anzeige Name</FieldLabel>
                    <Input
                      id="displayName"
                      name="displayName"
                      placeholder="Brian Smith (Urlaub)"
                      defaultValue={user.displayName ?? ""}
                      disabled={pending}
                    />
                    <FieldError />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* PERSONAL */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-balance font-semibold text-foreground">
                Personal information
              </h2>
              <p className="text-pretty mt-1 text-sm leading-6 text-muted-foreground">
                Bearbeite deine persönlichen Daten.
              </p>
            </div>

            <div className="sm:max-w-3xl md:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div className="col-span-full sm:col-span-3">
                  {/* Achtung: Labels bei dir waren vertauscht – ich korrigiere */}
                  <Field name="firstName" className="gap-2">
                    <FieldLabel htmlFor="firstName">Vorname</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Emma"
                      defaultValue={user.firstName ?? ""}
                      disabled={pending}
                    />
                    <FieldError />
                  </Field>
                </div>

                <div className="col-span-full sm:col-span-3">
                  <Field name="lastName" className="gap-2">
                    <FieldLabel htmlFor="lastName">Nachname</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Crown"
                      defaultValue={user.lastName ?? ""}
                      disabled={pending}
                    />
                    <FieldError />
                  </Field>
                </div>

                <div className="col-span-full">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" value={user.email} disabled readOnly />
                    <FieldDescription>
                      Email kann nicht geändert werden.
                    </FieldDescription>
                  </Field>
                </div>

                <div className="col-span-full sm:col-span-3">
                  <Field className="gap-2">
                    <FieldLabel>Status</FieldLabel>
                    <Input
                      value={user.isActive ? "Aktiv" : "Inaktiv"}
                      disabled
                      readOnly
                    />
                  </Field>
                </div>

                <div className="col-span-full sm:col-span-3">
                  <Field className="gap-2">
                    <FieldLabel>Email verifiziert</FieldLabel>
                    <Input
                      value={user.emailVerified ? "Ja" : "Nein"}
                      disabled
                      readOnly
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="submit"
              className="whitespace-nowrap rounded-full"
              disabled={pending}>
              {pending ? "Speichere…" : "Speichern"}
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
