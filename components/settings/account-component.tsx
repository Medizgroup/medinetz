"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldItem,
  FieldLabel,
} from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import {
  changeEmailAction,
  changePasswordAction,
  accountSettingsAction,
} from "@/app/(app)/actions/users/account";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "../ui/card";
import { Fieldset, FieldsetLegend } from "../ui/fieldset";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { toastManager } from "../ui/toast";

type Errors = Record<string, string | string[]>;

const initialState = { ok: false, errors: {} as Errors };

export default function AccountComponent({
  user,
}: {
  user: { email: string; emailVerified: boolean };
}) {
  const [emailState, emailAction] = React.useActionState(
    changeEmailAction,
    initialState,
  );
  const [pwState, pwAction] = React.useActionState(
    changePasswordAction,
    initialState,
  );
  const [prefState, prefAction] = React.useActionState(
    accountSettingsAction,
    initialState,
  );

  React.useEffect(() => {
    if (emailState.ok || pwState.ok || prefState.ok) {
      toastManager.add({
        description: "Deine Änderungen wurden gespeichert.",
        title: "Success!",
        type: "success",
      });
    }
  }, [emailState.ok, pwState.ok, prefState.ok]);

  const defaultLanguage = "de";
  const defaultTimezone = "Europe/Berlin";
  const defaultEmailNotifications = true;

  const [emailNotifications, setEmailNotifications] = React.useState(
    defaultEmailNotifications,
  );
  return (
    <div className="flex items-center justify-center p-10">
      <div className="w-full max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-sm text-muted-foreground">
            Deine Persönliches Konto bearbeiten
          </p>
        </div>

        {/* 1) Email ändern */}
        <Form errors={emailState.errors} action={emailAction}>
          <Card className="max-w-5xl">
            <CardHeader>
              <CardTitle>Email ändern</CardTitle>
              <CardDescription>Ändere deine Email Adresse.</CardDescription>
            </CardHeader>
            <CardPanel className="">
              <Field name="email" className="">
                {/* <FieldLabel htmlFor="email">Deine Email Adresse</FieldLabel> */}
                <Input
                  id="email"
                  size="lg"
                  name="email"
                  defaultValue={user.email}
                />
                <FieldError />
              </Field>
            </CardPanel>
            <CardFooter className="justify-end space-x-4">
              <Button type="submit" className="rounded-full">
                Email speichern
              </Button>
            </CardFooter>
          </Card>
        </Form>

        <Separator className="my-10! " />

        {/* 2) Passwort ändern */}
        <Form errors={pwState.errors} action={pwAction}>
          <Card className="max-w-5xl">
            <CardHeader>
              <CardTitle>Passwort ändern</CardTitle>
              <CardDescription>Ändere dein aktuelles Passwort</CardDescription>
            </CardHeader>
            <CardPanel className="grid grid-cols-1 gap-6">
              <Field name="currentPassword" className="gap-2">
                <FieldLabel htmlFor="currentPassword">
                  Aktuelles Passwort
                </FieldLabel>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  size="lg"
                />
                <FieldError />
              </Field>
              <Field name="newPassword" className="gap-2">
                <FieldLabel htmlFor="newPassword">Neues Passwort</FieldLabel>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  size="lg"
                />
                <FieldError />
              </Field>
              <Field name="confirmPassword" className="gap-2">
                <FieldLabel htmlFor="confirmPassword">
                  Neues Passwort wiederholen
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  size="lg"
                />
                <FieldError />
              </Field>
            </CardPanel>
            <CardFooter className="justify-end space-x-4">
              <Button type="submit" className="rounded-full">
                Passwort speichern
              </Button>
            </CardFooter>
          </Card>
        </Form>

        <Separator className="my-10" />

        {/* 3) Basis-Account Settings (UserPreference) */}
        <Form errors={prefState.errors} action={prefAction}>
          <Card className="max-w-5xl">
            <CardHeader>
              <CardTitle>Basis Einstellungen</CardTitle>
              <CardDescription>
                Ändere deine Sprache, Zeitzone oder
                Benachrichtigungspräferenzen.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <Field
                name="language"
                className="gap-4"
                render={(fieldProps) => <Fieldset {...fieldProps} />}>
                <FieldsetLegend className="text-sm font-medium">
                  Sprache
                </FieldsetLegend>

                <RadioGroup name="language" defaultValue={defaultLanguage}>
                  <FieldItem>
                    <FieldLabel className="font-normal flex items-center gap-2">
                      <RadioGroupItem value="de" /> Deutsch
                    </FieldLabel>
                  </FieldItem>
                  <FieldItem>
                    <FieldLabel className="font-normal flex items-center gap-2">
                      <RadioGroupItem value="en" /> English
                    </FieldLabel>
                  </FieldItem>
                </RadioGroup>

                <FieldError />
              </Field>
              <Field
                name="timezone"
                className="gap-4"
                render={(fieldProps) => <Fieldset {...fieldProps} />}>
                <FieldsetLegend className="text-sm font-medium">
                  Zeitzone
                </FieldsetLegend>

                <RadioGroup name="timezone" defaultValue={defaultTimezone}>
                  <FieldItem>
                    <FieldLabel className="font-normal flex items-center gap-2">
                      <RadioGroupItem value="Europe/Berlin" /> Europe/Berlin
                    </FieldLabel>
                  </FieldItem>
                  <FieldItem>
                    <FieldLabel className="font-normal flex items-center gap-2">
                      <RadioGroupItem value="Europe/Vienna" /> Europe/Vienna
                    </FieldLabel>
                  </FieldItem>
                  <FieldItem>
                    <FieldLabel className="font-normal flex items-center gap-2">
                      <RadioGroupItem value="Europe/Zurich" /> Europe/Zurich
                    </FieldLabel>
                  </FieldItem>
                </RadioGroup>

                <FieldError />
              </Field>

              <Field name="emailNotifications" className="gap-2">
                <FieldLabel className="flex items-center justify-between gap-4">
                  <span>Email Benachrichtigungen</span>

                  {/* Hidden input -> Server Action bekommt "true"/"false" */}
                  <input
                    type="hidden"
                    name="emailNotifications"
                    value={emailNotifications ? "true" : "false"}
                  />

                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(v) => setEmailNotifications(Boolean(v))}
                  />
                </FieldLabel>
                <FieldError />
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" className=" rounded-full whitespace-nowrap">
                Speichern
              </Button>
            </CardFooter>
          </Card>
        </Form>
      </div>
    </div>
  );
}
