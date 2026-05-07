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

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "R", label: "R – Routine" },
  { value: "S", label: "S – Schwangerschaft" },
  { value: "A", label: "A – Allgemein" },
  { value: "K", label: "K – Kinder" },
  { value: "O", label: "O – Sonstige" },
];

const CURRENT_YEAR = String(new Date().getFullYear()).slice(-2);

// ─── Component ────────────────────────────────────────────────────────────────

export function PatientPseudonymInput({
  onValueChange,
}: PatientPseudonymInputProps) {
  const [category, setCategory] = React.useState("");
  const [lastName2, setLastName2] = React.useState("");
  const [firstName2, setFirstName2] = React.useState("");
  const [sex, setSex] = React.useState("");
  const [birthYear, setBirthYear] = React.useState(CURRENT_YEAR);

  const [checking, setChecking] = React.useState(false);
  const [lookupResult, setLookupResult] = React.useState<{
    exists: boolean;
    patient: { id: string; pseudonym: string } | null;
  } | null>(null);
  const [useExisting, setUseExisting] = React.useState<boolean | null>(null);

  const ln2Ref = React.useRef<HTMLInputElement>(null);
  const fn2Ref = React.useRef<HTMLInputElement>(null);
  const yearRef = React.useRef<HTMLInputElement>(null);
  const lookupTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build pseudonym only when all segments are complete
  const pseudonym = React.useMemo(() => {
    const ln = lastName2.toUpperCase();
    const fn = firstName2.toUpperCase();
    const yy = birthYear || CURRENT_YEAR;
    if (!category || ln.length < 2 || fn.length < 2 || !sex || yy.length < 2)
      return null;
    return `${category}-${ln}-${fn}-${sex}-${yy}`;
  }, [category, lastName2, firstName2, sex, birthYear]);

  const requirements = [
    { met: !!category, text: "Kategorie gewählt" },
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

    if (!pseudonym) return;

    setChecking(true);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

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
      {/* Live preview */}
      <div className="rounded-lg border border-border bg-muted px-4 py-3 text-center font-mono text-lg tracking-[0.2em]">
        <PseudonymPreview
          category={category}
          lastName2={lastName2}
          firstName2={firstName2}
          sex={sex}
          birthYear={birthYear}
        />
      </div>
      {/* Segmented inputs */}
      <div className="grid grid-cols-5 gap-2">
        <SegmentField label="Kategorie">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v ?? "");

              setTimeout(() => ln2Ref.current?.focus(), 0);
            }}>
            <SelectTrigger className="font-mono text-center">
              <SelectValue placeholder="?" />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </SegmentField>

        <SegmentField label="Nachname">
          <Input
            ref={ln2Ref}
            className="text-center font-mono uppercase tracking-widest"
            maxLength={2}
            value={lastName2}
            placeholder="--"
            onChange={(e) => {
              const v = e.target.value
                .replace(/[^a-zA-ZäöüÄÖÜ]/g, "")
                .toUpperCase()
                .slice(0, 2);
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
            onChange={(e) => {
              const v = e.target.value
                .replace(/[^a-zA-ZäöüÄÖÜ]/g, "")
                .toUpperCase()
                .slice(0, 2);
              setFirstName2(v);
            }}
          />
        </SegmentField>

        <SegmentField label="Geschlecht">
          <Select
            value={sex}
            onValueChange={(v) => {
              setSex(v ?? "");
              setTimeout(() => yearRef.current?.focus(), 0);
            }}>
            <SelectTrigger className="font-mono text-center">
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
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
              setBirthYear(v);
            }}
          />
        </SegmentField>
      </div>

      {/* Requirements */}
      <ul className="space-y-1.5" aria-label="Pseudonym-Anforderungen">
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

      {/* Lookup status */}
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
  category,
  lastName2,
  firstName2,
  sex,
  birthYear,
}: {
  category: string;
  lastName2: string;
  firstName2: string;
  sex: string;
  birthYear: string;
}) {
  const segments = [
    { value: category || "?", filled: !!category },
    {
      value: lastName2.toUpperCase().padEnd(2, "?").slice(0, 2),
      filled: lastName2.length === 2,
    },
    {
      value: firstName2.toUpperCase().padEnd(2, "?").slice(0, 2),
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
