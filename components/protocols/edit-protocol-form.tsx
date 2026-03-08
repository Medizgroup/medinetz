"use client";

import * as React from "react";
import type { Value } from "platejs";
import { useRouter } from "next/navigation";

import ProtocolEditor from "@/components/protocols/protocol-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function EditProtocolForm({
  protocol,
}: {
  protocol: {
    id: string;
    title: string;
    date: string;
    description: Value;
  };
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState(protocol.title);
  const [date, setDate] = React.useState(protocol.date);
  const [value, setValue] = React.useState<Value>(protocol.description ?? []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/protocols/${protocol.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        date,
        description: value,
      }),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel>Titel</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Datum</FieldLabel>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <Field className="gap-2">
        <FieldLabel>Beschreibung</FieldLabel>
        <ProtocolEditor value={value} onChange={setValue} />
      </Field>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? "Speichere…" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
