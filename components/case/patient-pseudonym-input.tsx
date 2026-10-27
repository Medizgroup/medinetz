/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PatientPseudonymValue =
  | { mode: "existing"; pseudonym: string; patientId: string }
  | { mode: "new"; pseudonym: string }
  | { mode: "new-forced"; pseudonym: string }; // server appends suffix

interface PatientPseudonymInputProps {
  onValueChange: (value: PatientPseudonymValue | null) => void;
}

type InputMode = "generate" | "manual";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = String(new Date().getFullYear()).slice(-2);
const MAX_MANUAL_LENGTH = 64; // gleiche Grenze wie POST /api/cases

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Patienten-Referenz: entweder aus Namens-Kürzeln generiert
 * (z.B. MU-AH-X-85) oder frei eingegeben. In beiden Fällen wird geprüft, ob
 * der Patient schon existiert.
 */
export function PatientPseudonymInput({
  onValueChange,
}: PatientPseudonymInputProps) {
  const [mode, setMode] = React.useState<InputMode>("generate");

  const [lastName2, setLastName2] = React.useState("");
  const [firstName2, setFirstName2] = React.useState("");
  const [sex, setSex] = React.useState("");
  const [birthYear, setBirthYear] = React.useState(CURRENT_YEAR);
  const [manual, setManual] = React.useState("");

  const [checking, setChecking] = React.useState(false);
  const [lookupResult, setLookupResult] = React.useState<{
    exists: boolean;
    patient: { id: string; pseudonym: string } | null;
  } | null>(null);
  const [useExisting, setUseExisting] = React.useState<boolean | null>(null);

  const fn2Ref = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);
  const lookupTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const generated = React.useMemo(() => {
    if (lastName2.length < 2 || firstName2.length < 2 || !sex) return null;
    if (birthYear.length < 2) return null;
    return `${lastName2}-${firstName2}-${sex}-${birthYear}`;
  }, [lastName2, firstName2, sex, birthYear]);

  const manualValue = manual.trim();
  const pseudonym =
    mode === "generate"
      ? generated
      : manualValue.length >= 2
        ? manualValue
        : null;

  const requirements = [
    { met: lastName2.length === 2, text: "Nachname – 2 Buchstaben" },
    { met: firstName2.length === 2, text: "Vorname – 2 Buchstaben" },
    { met: !!sex, text: "Geschlecht angegeben" },
    { met: birthYear.length === 2, text: "Geburtsjahr – 2 Ziffern" },
  ];

  // Debounced lookup on pseudonym change
  React.useEffect(() => {
    setLookupResult(null);
    setUseExisting(null);
    onValueChange(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    if (!pseudonym) {
      setChecking(false);
      return;
    }

    setChecking(true);
    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/patients/lookup?pseudonym=${encodeURIComponent(pseudonym)}`,
        );
        const data = await res.json();
        setLookupResult(data);
        if (!data.exists) {
          onValueChange({ mode: "new", pseudonym });
        }
      } catch {
        // silently ignore network errors
      } finally {
        setChecking(false);
      }
    }, 450);
  }, [pseudonym]); // eslint-disable-line react-hooks/exhaustive-deps

  // Propagate choice when user picks existing vs new
  React.useEffect(() => {
    if (!pseudonym || !lookupResult?.exists || useExisting === null) return;
    if (useExisting) {
      onValueChange({
        mode: "existing",
        pseudonym,
        patientId: lookupResult.patient!.id,
      });
    } else {
      onValueChange({ mode: "new-forced", pseudonym });
    }
  }, [useExisting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <RadioGroup
        value={mode}
        onValueChange={(v) => setMode(v as InputMode)}
        className="flex flex-row flex-wrap gap-2">
        {(
          [
            { value: "generate", label: "Referenz generieren" },
            { value: "manual", label: "Selbst eingeben" },
          ] as const
        ).map((o) => (
          <Label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-normal hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
            <Radio value={o.value} />
            {o.label}
          </Label>
        ))}
      </RadioGroup>

      {mode === "generate" ? (
        <>
          <div className="rounded-lg border border-border bg-muted px-4 py-3 text-center font-mono text-lg tracking-[0.2em]">
            <PseudonymPreview
              lastName2={lastName2}
              firstName2={firstName2}
              sex={sex}
              birthYear={birthYear}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SegmentField label="Nachname">
              <Input
                className="text-center font-mono uppercase tracking-widest"
                maxLength={2}
                value={lastName2}
                placeholder="--"
                onChange={(e) => {
                  const v = lettersOnly(e.target.value);
                  setLastName2(v);
                  if (v.length === 2) fn2Ref.current?.focus();
                }}
              />
            </SegmentField>

            <SegmentField label="Vorname">
              <Input
                ref={fn2Ref}
                className="text-center font-mono uppercase tracking-widest"
                maxLength={2}
                value={firstName2}
                placeholder="--"
                onChange={(e) => setFirstName2(lettersOnly(e.target.value))}
              />
            </SegmentField>

            <SegmentField label="Geschlecht">
              <Select
                value={sex}
                onValueChange={(v) => {
                  setSex(v ?? "");
                  setTimeout(() => yearRef.current?.focus(), 0);
                }}>
                <SelectTrigger className="text-center font-mono">
                  <SelectValue placeholder="?" />
                </SelectTrigger>
                <SelectPopup alignItemWithTrigger={false}>
                  <SelectItem value="X">X – Weiblich</SelectItem>
                  <SelectItem value="Y">Y – Männlich</SelectItem>
                  <SelectItem value="D">D – Divers</SelectItem>
                  <SelectItem value="U">U – Unbekannt</SelectItem>
                </SelectPopup>
              </Select>
            </SegmentField>

            <SegmentField label="Jahrgang">
              <Input
                ref={yearRef}
                className="text-center font-mono tracking-widest"
                maxLength={2}
                value={birthYear}
                placeholder={CURRENT_YEAR}
                onChange={(e) =>
                  setBirthYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
                }
              />
            </SegmentField>
          </div>

          <ul className="space-y-1.5" aria-label="Referenz-Anforderungen">
            {requirements.map((req) => (
              <li key={req.text} className="flex items-center gap-1.5">
                {req.met ? (
                  <CheckIcon
                    className="size-3.5 shrink-0 text-emerald-500"
                    aria-hidden="true"
                  />
                ) : (
                  <XIcon
                    className="size-3.5 shrink-0 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "text-xs transition-colors",
                    req.met ? "text-emerald-600" : "text-muted-foreground",
                  )}>
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Input
          value={manual}
          maxLength={MAX_MANUAL_LENGTH}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Eigene Referenz, z.B. MU-AH-85"
          className="font-mono"
        />
      )}

      {pseudonym && (
        <div className="mt-1">
          {checking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-3.5" />
              Referenz wird geprüft…
            </div>
          )}

          {!checking && lookupResult && !lookupResult.exists && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckIcon
                className="size-3.5 text-emerald-500"
                aria-hidden="true"
              />
              Referenz verfügbar – neuer Patient wird angelegt
            </p>
          )}

          {!checking && lookupResult?.exists && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <CheckIcon className="size-4" aria-hidden="true" />
                Patient mit dieser Referenz bereits bekannt
              </p>
              <div className="flex gap-2">
                <ChoiceButton
                  active={useExisting === true}
                  activeClass="border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                  onClick={() => setUseExisting(true)}>
                  Bestehenden verwenden
                </ChoiceButton>
                <ChoiceButton
                  active={useExisting === false}
                  activeClass="border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                  onClick={() => setUseExisting(false)}>
                  Neuen anlegen
                </ChoiceButton>
              </div>
              {useExisting === false && (
                <p className="text-xs text-muted-foreground">
                  Referenz erhält automatisch ein Suffix:{" "}
                  <span className="font-mono">{pseudonym}-1</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function lettersOnly(value: string) {
  return value
    .replace(/[^a-zA-ZäöüÄÖÜ]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SegmentField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ChoiceButton({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-3 py-2 text-sm transition-colors",
        active ? activeClass : "border-border bg-background hover:bg-muted",
      )}>
      {children}
    </button>
  );
}

function PseudonymPreview({
  lastName2,
  firstName2,
  sex,
  birthYear,
}: {
  lastName2: string;
  firstName2: string;
  sex: string;
  birthYear: string;
}) {
  const segments = [
    {
      value: lastName2.padEnd(2, "?").slice(0, 2),
      filled: lastName2.length === 2,
    },
    {
      value: firstName2.padEnd(2, "?").slice(0, 2),
      filled: firstName2.length === 2,
    },
    { value: sex || "?", filled: !!sex },
    {
      value: (birthYear || "??").padStart(2, "0").slice(-2),
      filled: birthYear.length === 2,
    },
  ];

  return (
    <span className="inline-flex items-center">
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-0.5 text-muted-foreground/30">-</span>}
          <span
            className={
              seg.filled ? "text-foreground" : "text-muted-foreground/30"
            }>
            {seg.value}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}
