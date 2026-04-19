"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "../ui/spinner";
import { getMentionQuery } from "@/lib/helper/search";

export default function ProtocolCommentForm({
  protocolId,
}: {
  protocolId: string;
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<
    { id: string; name: string; email?: string }[]
  >([]);

  const [showSuggestions, setShowSuggestions] = React.useState(false);

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

  function insertMention(user: { id: string; name: string }) {
    const textarea = document.activeElement as HTMLTextAreaElement;
    const cursor = textarea.selectionStart;

    const before = content.slice(0, cursor);
    const after = content.slice(cursor);

    const newText =
      before.replace(/@([A-Za-z0-9_-]*)$/, `@[${user.name}](${user.id}) `) +
      after;

    setContent(newText);
    setShowSuggestions(false);
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
          onChange={async (e) => {
            const value = e.target.value;
            setContent(value);

            const cursor = e.target.selectionStart;
            const query = getMentionQuery(value, cursor);

            if (query !== null) {
              const res = await fetch(`/api/users/search?q=${query}`);
              const users = await res.json();

              setSuggestions(users);
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          placeholder="Schreibe einen Kommentar… "
          required
        />
        <FieldDescription>
          Nutze @ um andere Teilnehmer zu erwähnen.
        </FieldDescription>
        {showSuggestions && suggestions.length > 0 && (
          <div className="border rounded-md bg-white shadow p-2 space-y-1">
            {suggestions.map((user: any) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded">
                {user.name ?? user.email}
              </button>
            ))}
          </div>
        )}
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
