"use client";

import * as React from "react";
import type { Value } from "platejs";
import { useRouter } from "next/navigation";

import ProtocolEditor from "@/components/protocols/protocol-editor";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Membership = {
  organization: {
    id: string;
    name: string;
    type: string;
  };
};

const emptyValue: Value = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export default function NewProtocolForm({
  memberships,
}: {
  memberships: Membership[];
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [organizationId, setOrganizationId] = React.useState(
    memberships[0]?.organization.id ?? "",
  );
  const [value, setValue] = React.useState<Value>(emptyValue);

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
        date,
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
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Neues Protokoll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erstelle ein neues Protokoll.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="gap-2">
            <FieldLabel>Titel</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Routine Plenum KW 14"
              required
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel>Datum</FieldLabel>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
        </div>

        <Field className="gap-2">
          <FieldLabel>Organisation</FieldLabel>
          <Select value={organizationId} onValueChange={setOrganizationId}>
            <SelectTrigger>
              <SelectValue placeholder="Organisation wählen" />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((m) => (
                <SelectItem key={m.organization.id} value={m.organization.id}>
                  {m.organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field className="gap-2">
          <FieldLabel>Beschreibung</FieldLabel>
          <ProtocolEditor
            value={value}
            onChange={setValue}
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
