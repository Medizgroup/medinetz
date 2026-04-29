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

type CaseInput = {
  id: string;
  title: string;
  description: string | null;
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

  const [priority, setPriority] = React.useState(caseData.priority);
  const [sensitivityLevel, setSensitivityLevel] = React.useState(
    String(caseData.sensitivityLevel),
  );
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    caseData.dueDate ? new Date(caseData.dueDate) : undefined,
  );
  const [estimatedCosts, setEstimatedCosts] = React.useState<number | null>(
    caseData.estimatedCosts ? Number(caseData.estimatedCosts) : null,
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
        priority,
        sensitivityLevel: Number(sensitivityLevel),
        dueDate: dueDate || null,
        estimatedCosts: estimatedCosts ?? null,
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

        {/* <Field className="gap-2">
          <FieldLabel>Patient Referenz</FieldLabel>
          <Input
            value={patientPseudonym}
            onChange={(e) => setPatientPseudonym(e.target.value)}
            required
          />
        </Field> */}

        {/* <Field className="gap-2">
          <FieldLabel>Sprache</FieldLabel>
          <Input
            value={patientLanguage}
            onChange={(e) => setPatientLanguage(e.target.value)}
          />
        </Field> */}
      </div>

      <Field className="gap-2">
        <FieldLabel>Beschreibung</FieldLabel>
        <Textarea
          rows={5}
          value={description}
          className="h-32"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {/* <Field className="gap-2">
        <FieldLabel>Patient-Notizen</FieldLabel>
        <Textarea
          rows={4}
          value={patientNotes}
          className="h-28"
          onChange={(e) => setPatientNotes(e.target.value)}
        />
      </Field> */}

      <div className="grid gap-4 sm:grid-cols-4">
        <Field className="gap-2">
          <FieldLabel>Priorität</FieldLabel>
          <Select
            items={[
              { label: "Niedrig", value: "LOW" },
              { label: "Mittel", value: "MEDIUM" },
              { label: "Hoch", value: "HIGH" },
              { label: "Dringend", value: "URGENT" },
            ]}
            value={priority}
            onValueChange={(value) => {
              if (value !== null) setPriority(value);
            }}>
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
          <Select
            items={[
              { label: "1 – Standard", value: "1" },
              { label: "2 – Erhöht", value: "2" },
              { label: "3 – Sehr hoch", value: "3" },
            ]}
            value={sensitivityLevel}
            onValueChange={(value) => {
              if (value !== null) setSensitivityLevel(value);
            }}>
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
        </Field>

        <Field className="gap-2">
          <FieldLabel>Geschätzte Kosten</FieldLabel>
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end mt-4">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? "Speichere…" : "Änderungen speichern"}
        </Button>
      </div>
    </form>
  );
}
