"use client";

import * as React from "react";
import type { Value } from "platejs";
import { useRouter } from "next/navigation";

import ProtocolEditor, {
  defaultTemplate,
} from "@/components/protocols/protocol-editor";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectPopup,
} from "@/components/ui/select";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { de } from "date-fns/locale";

type Membership = {
  organization: {
    id: string;
    name: string;
    type: string;
  };
};

export default function NewProtocolForm({
  memberships,
}: {
  memberships: Membership[];
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [organizationId, setOrganizationId] = React.useState(
    memberships[0]?.organization.id ?? "",
  );
  const [value, setValue] = React.useState<Value>(defaultTemplate);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/protocols", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        date: date ? format(date, "yyyy-MM-dd") : null,
        organizationId,
        description: value,
      }),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    router.push(`/protocols/${data.protocol.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8 overflow-x-clip">
      <div>
        <h1 className="text-2xl font-semibold">Neues Protokoll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erstelle ein neues Protokoll.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 justify- items-end">
          <Field className="gap-2">
            <FieldLabel>Titel</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
              size="lg"
              required
            />
          </Field>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  size="lg"
                  className=" justify-start"
                  variant="outline"
                />
              }>
              <CalendarIcon aria-hidden="true" />
              {date ? format(date, "PPP", { locale: de }) : "Datum auswählen"}
            </PopoverTrigger>
            <PopoverPopup>
              <Calendar
                defaultMonth={date}
                mode="single"
                onSelect={setDate}
                selected={date}
              />
            </PopoverPopup>
          </Popover>
        </div>

        <Field className="gap-2">
          <FieldLabel>Organisation</FieldLabel>
          <Select
            aria-label="Organisation auswählen"
            value={organizationId}
            items={memberships.map((m) => ({
              label: m.organization.name,
              value: m.organization.id,
            }))}
            onValueChange={(orgId) => orgId && setOrganizationId(orgId)} // setzt organisationID wenn ausgewählt
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              {memberships.map((m) => (
                <SelectItem key={m.organization.id} value={m.organization.id}>
                  {m.organization.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>

        <Field className="gap-2">
          <FieldLabel>Beschreibung</FieldLabel>
          <ProtocolEditor
            value={value}
            onChange={setValue}
            organizationId={organizationId}
            placeholder="Hier schreiben..."
          />
        </Field>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/protocols")}>
            Abbrechen
          </Button>

          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving ? "Speichere…" : "Protokoll erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
