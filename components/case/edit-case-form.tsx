"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CaseInput = {
  id: string;
  title: string;
  description: string | null;
  patientPseudonym: string;
  patientLanguage: string | null;
  patientNotes: string | null;
  priority: string;
  sensitivityLevel: number;
  dueDate: string | null;
  estimatedCosts: string | null;
};

export default function EditCaseForm({ caseData }: { caseData: CaseInput }) {
  const router = useRouter();

  const [title, setTitle] = React.useState(caseData.title);
  const [description, setDescription] = React.useState(
    caseData.description ?? "",
  );
  const [patientPseudonym, setPatientPseudonym] = React.useState(
    caseData.patientPseudonym,
  );
  const [patientLanguage, setPatientLanguage] = React.useState(
    caseData.patientLanguage ?? "",
  );
  const [patientNotes, setPatientNotes] = React.useState(
    caseData.patientNotes ?? "",
  );
  const [priority, setPriority] = React.useState(caseData.priority);
  const [sensitivityLevel, setSensitivityLevel] = React.useState(
    String(caseData.sensitivityLevel),
  );
  const [dueDate, setDueDate] = React.useState(caseData.dueDate ?? "");
  const [estimatedCosts, setEstimatedCosts] = React.useState(
    caseData.estimatedCosts ?? "",
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/cases/${caseData.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        patientPseudonym,
        patientLanguage: patientLanguage || null,
        patientNotes: patientNotes || null,
        priority,
        sensitivityLevel: Number(sensitivityLevel),
        dueDate: dueDate || null,
        estimatedCosts: estimatedCosts === "" ? null : estimatedCosts,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="gap-2 sm:col-span-2">
          <FieldLabel>Titel</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Patient (Pseudonym)</FieldLabel>
          <Input
            value={patientPseudonym}
            onChange={(e) => setPatientPseudonym(e.target.value)}
            required
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Sprache</FieldLabel>
          <Input
            value={patientLanguage}
            onChange={(e) => setPatientLanguage(e.target.value)}
          />
        </Field>
      </div>

      <Field className="gap-2">
        <FieldLabel>Beschreibung</FieldLabel>
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field className="gap-2">
        <FieldLabel>Patient-Notizen (intern)</FieldLabel>
        <Textarea
          rows={4}
          value={patientNotes}
          onChange={(e) => setPatientNotes(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field className="gap-2">
          <FieldLabel>Priorität</FieldLabel>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Niedrig</SelectItem>
              <SelectItem value="MEDIUM">Mittel</SelectItem>
              <SelectItem value="HIGH">Hoch</SelectItem>
              <SelectItem value="URGENT">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="gap-2">
          <FieldLabel>Sensibilität</FieldLabel>
          <Select value={sensitivityLevel} onValueChange={setSensitivityLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 – Standard</SelectItem>
              <SelectItem value="2">2 – Erhöht</SelectItem>
              <SelectItem value="3">3 – Sehr hoch</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="gap-2">
          <FieldLabel>Frist</FieldLabel>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Geschätzte Kosten (€)</FieldLabel>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCosts}
            onChange={(e) => setEstimatedCosts(e.target.value)}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? "Speichere…" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
