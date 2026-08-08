"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast";
import { changePasswordAction } from "@/app/(app)/actions/users/account";

type Errors = Record<string, string | string[]>;
const initialState = { ok: false, errors: {} as Errors };

export default function ForcePasswordChangeDialog() {
  const router = useRouter();
  const [state, formAction, pending] = React.useActionState(
    changePasswordAction,
    initialState,
  );

  React.useEffect(() => {
    if (state.ok) {
      toastManager.add({
        title: "Passwort geändert",
        description: "Du kannst die App jetzt normal weiter nutzen.",
        type: "success",
      });
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Dialog open modal>
      <DialogPopup className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Neues Passwort erforderlich</DialogTitle>
          <DialogDescription>
            Dein Passwort wurde von einer Administratorin/einem Administrator
            zurückgesetzt. Bitte lege jetzt ein neues, eigenes Passwort fest,
            bevor du fortfährst.
          </DialogDescription>
        </DialogHeader>

        <Form errors={state.errors} action={formAction}>
          <DialogPanel className="grid gap-4">
            <Field name="currentPassword" className="gap-2">
              <FieldLabel htmlFor="fpc-current">
                Aktuelles Passwort (von der Admin mitgeteilt)
              </FieldLabel>
              <Input
                id="fpc-current"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                disabled={pending}
                required
              />
              <FieldError />
            </Field>
            <Field name="newPassword" className="gap-2">
              <FieldLabel htmlFor="fpc-new">Neues Passwort</FieldLabel>
              <Input
                id="fpc-new"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                disabled={pending}
                required
              />
              <FieldError />
            </Field>
            <Field name="confirmPassword" className="gap-2">
              <FieldLabel htmlFor="fpc-confirm">
                Neues Passwort wiederholen
              </FieldLabel>
              <Input
                id="fpc-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                disabled={pending}
                required
              />
              <FieldError />
            </Field>
          </DialogPanel>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={pending}>
              {pending ? "Speichere…" : "Passwort ändern"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
