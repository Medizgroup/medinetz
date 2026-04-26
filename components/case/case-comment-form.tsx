"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Value } from "platejs";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

import CaseCommentEditor from "./case-comment-editor";

const emptyValue: Value = [{ type: "p", children: [{ text: "" }] }];

function isEmpty(v: Value) {
  if (!Array.isArray(v) || v.length === 0) return true;
  return v.every((n: any) => {
    if (!Array.isArray(n.children)) return true;
    return n.children.every((c: any) => {
      if (typeof c.text === "string") return c.text.trim() === "";
      return false;
    });
  });
}

export default function CaseCommentForm({
  caseId,
  organizationId,
}: {
  caseId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState<Value>(emptyValue);
  const [editorKey, setEditorKey] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEmpty(value) || saving) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/case-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, content: value }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Kommentar konnte nicht gespeichert werden.");
      return;
    }

    setValue(emptyValue);
    setEditorKey((k) => k + 1);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field className="gap-2">
        <CaseCommentEditor
          key={editorKey}
          value={value}
          onChange={setValue}
          organizationId={organizationId}
        />
        <FieldDescription>
          Nutze <span className="font-medium">@</span>, um andere Mitglieder zu
          erwähnen.
        </FieldDescription>
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || isEmpty(value)}>
          {saving ? <Spinner /> : null}
          Kommentar speichern
        </Button>
      </div>
    </form>
  );
}
