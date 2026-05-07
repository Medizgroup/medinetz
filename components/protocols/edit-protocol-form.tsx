"use client";

import * as React from "react";
import type { Value } from "platejs";
import { useRouter } from "next/navigation";

import ProtocolEditor from "@/components/protocols/protocol-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function EditProtocolForm({
  protocol,
}: {
  protocol: {
    id: string;
    organizationId: string;
    title: string;
    date: string;
    description: Value;
  };
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState(protocol.title);
  const [date, setDate] = React.useState<Date | undefined>(
    protocol.date ? new Date(protocol.date) : undefined,
  );
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
        date: date ? format(date, "yyyy-MM-dd") : null,
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
    <form onSubmit={onSubmit} className="space-y-4 p-5 ">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel>Titel</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Datum</FieldLabel>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className="w-[280px] justify-start text-left font-normal"
                  variant="outline"
                />
              }>
              <CalendarIcon />
              {date ? (
                format(date, "PPP", { locale: de })
              ) : (
                <span> Datum auswählen</span>
              )}
            </PopoverTrigger>
            <PopoverPopup align="start" className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverPopup>
          </Popover>
        </Field>
      </div>

      <Field className="gap-2">
        <FieldLabel>Beschreibung</FieldLabel>
        <ProtocolEditor
          value={value}
          onChange={setValue}
          organizationId={protocol.organizationId}
        />
      </Field>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? "Lädt..." : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
