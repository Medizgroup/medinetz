"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "../ui/spinner";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <Field className="gap-2">
        {/* <FieldLabel>Neuer Kommentar</FieldLabel> */}
        <Textarea
          rows={12}
          value={content}
          className="min-h-[130px]"
          size="lg"
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schreibe einen Kommentar… "
          required
        />
        <FieldDescription>
          Einen User erwähnen: @benutzername, einen Fall erwähnen: #Fall
        </FieldDescription>
      </Field>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? <Spinner /> : "Senden"}
        </Button>
      </div>
    </form>
  );
}
