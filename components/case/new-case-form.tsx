"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Membership = {
  organization: { id: string; name: string };
};

export default function NewCaseForm({
  memberships,
}: {
  memberships: Membership[];
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [organizationId, setOrganizationId] = React.useState(
    memberships[0]?.organization.id ?? "",
  );
  const [patientPseudonym, setPatientPseudonym] = React.useState("");
  const [patientLanguage, setPatientLanguage] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [patientNotes, setPatientNotes] = React.useState("");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [sensitivityLevel, setSensitivityLevel] = React.useState("1");
  const [dueDate, setDueDate] = React.useState("");
  const [estimatedCosts, setEstimatedCosts] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        organizationId,
        patientPseudonym,
        patientLanguage: patientLanguage || null,
        description: description || null,
        patientNotes: patientNotes || null,
        priority,
        sensitivityLevel: Number(sensitivityLevel),
        dueDate: dueDate || null,
        estimatedCosts: estimatedCosts || null,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    router.push(`/cases/${data.case.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Neuer Fall</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lege einen neuen Fall an. Patient-Daten bitte anonymisiert.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="gap-2 sm:col-span-2">
            <FieldLabel>Titel</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kurze Beschreibung des Falls"
              size="lg"
              required
            />
          </Field>

          <Field className="gap-2">
            <FieldLabel>Organisation</FieldLabel>
            <Select
              value={organizationId}
              onValueChange={(v) => setOrganizationId(v ?? "")}>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field className="gap-2">
            <FieldLabel>Patient (Pseudonym)</FieldLabel>
            <Input
              value={patientPseudonym}
              onChange={(e) => setPatientPseudonym(e.target.value)}
              placeholder="z.B. P-2026-0042"
              required
            />
            <FieldDescription>
              Keine Klarnamen — bitte anonymisierten Code verwenden.
            </FieldDescription>
          </Field>

          <Field className="gap-2">
            <FieldLabel>Sprache</FieldLabel>
            <Input
              value={patientLanguage}
              onChange={(e) => setPatientLanguage(e.target.value)}
              placeholder="z.B. Arabisch, Farsi, Englisch"
            />
          </Field>
        </div>

        <Field className="gap-2">
          <FieldLabel>Beschreibung</FieldLabel>
          <Textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Worum geht es in diesem Fall?"
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Patient-Notizen (intern)</FieldLabel>
          <Textarea
            rows={4}
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            placeholder="Zusätzliche Informationen zum Patienten — sensibel behandeln."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field className="gap-2">
            <FieldLabel>Sensibilität</FieldLabel>
            <Select
              value={sensitivityLevel}
              onValueChange={setSensitivityLevel}>
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
              placeholder="0.00"
            />
          </Field>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/cases")}>
            Abbrechen
          </Button>
          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving ? "Speichere…" : "Fall erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
