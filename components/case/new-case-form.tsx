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
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { de } from "date-fns/locale";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "../ui/number-field";

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
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [estimatedCosts, setEstimatedCosts] = React.useState<number | null>(0);

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
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
        estimatedCosts: estimatedCosts ?? null,
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
              items={memberships.map((m) => ({
                value: m.organization.id,
                label: m.organization.name,
              }))}
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
            <Select
              value={priority}
              items={[
                { value: "LOW", label: "Niedrig" },
                { value: "MEDIUM", label: "Mittel" },
                { value: "HIGH", label: "Hoch" },
                { value: "URGENT", label: "Dringend" },
              ]}
              onValueChange={(v) => v && setPriority(v)}>
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
            <FieldLabel>Patient Referenz</FieldLabel>
            <Input
              value={patientPseudonym}
              onChange={(e) => setPatientPseudonym(e.target.value)}
              required
            />
            <FieldDescription>
              Pseudonymisierten Code verwenden.
            </FieldDescription>
          </Field>

          <Field className="gap-2">
            <FieldLabel>Sprache</FieldLabel>
            <Input
              value={patientLanguage}
              onChange={(e) => setPatientLanguage(e.target.value)}
            />
            <FieldDescription>
              Welche Sprache spricht der Patient
            </FieldDescription>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field className="gap-2">
            <FieldLabel>Sensibilität</FieldLabel>
            <Select
              value={sensitivityLevel}
              items={[
                { value: "1", label: "1 – Standard" },
                { value: "2", label: "2 – Erhöht" },
                { value: "3", label: "3 – Sehr hoch" },
              ]}
              onValueChange={(value) => setSensitivityLevel(value ?? "")}>
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
            <Popover>
              <PopoverTrigger
                render={
                  <Button className="w-full justify-start" variant="outline" />
                }>
                <CalendarIcon aria-hidden="true" />
                {dueDate
                  ? format(dueDate, "PPP", { locale: de })
                  : "Datum auswählen"}
              </PopoverTrigger>
              <PopoverPopup>
                <Calendar
                  defaultMonth={dueDate}
                  mode="single"
                  onSelect={setDueDate}
                  selected={dueDate}
                />
              </PopoverPopup>
            </Popover>
            {/* <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            /> */}
          </Field>

          <Field className="gap-2">
            <FieldLabel>Geschätzte Kosten (€)</FieldLabel>
            <NumberField
              value={estimatedCosts}
              onValueChange={(value) => setEstimatedCosts(value)}
              min={0}
              step={10}
              format={{ currency: "EUR", style: "currency" }}>
              <NumberFieldGroup>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
          </Field>
        </div>

        <Field className="gap-2">
          <FieldLabel>Beschreibung</FieldLabel>
          <Textarea
            rows={6}
            value={description}
            className="h-32"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Worum geht es in diesem Fall?"
          />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Patient-Notizen (intern)</FieldLabel>
          <Textarea
            rows={4}
            className="h-32"
            value={patientNotes}
            onChange={(e) => setPatientNotes(e.target.value)}
            placeholder="Zusätzliche Informationen zum Patienten — sensibel behandeln."
          />
        </Field>

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
