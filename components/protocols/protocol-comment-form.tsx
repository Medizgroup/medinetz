"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export default function ProtocolCommentForm({
  protocolId,
}: {
  protocolId: string;
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/protocol-comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ protocolId, content }),
    });

    const data = await res.json().catch(() => null);

    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Kommentar konnte nicht gespeichert werden.");
      return;
    }

    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-5 space-y-4">
      <Field className="gap-2">
        <FieldLabel>Neuer Kommentar</FieldLabel>
        <Textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schreibe einen Kommentar… Nutze @USER_ID oder /case:CASE_ID"
          required
        />
        <FieldDescription>
          Erwähne Personen mit <code>@USER_ID</code> und Fälle mit{" "}
          <code>/case:CASE_ID</code>.
        </FieldDescription>
      </Field>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? "Speichere…" : "Kommentar speichern"}
        </Button>
      </div>
    </form>
  );
}
