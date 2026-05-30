"use client";

import * as React from "react";
import type { Value } from "platejs";
import { useRouter } from "next/navigation";

import ProtocolEditor from "@/components/protocols/protocol-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toastManager } from "../ui/toast";
import { Spinner } from "../ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/helper/user";
import { Label } from "../ui/label";

type ActiveEditor = { id: string; name: string; avatarUrl: string | null };

const HEARTBEAT_MS = 15_000;

export default function EditProtocolForm({
  protocol,
}: {
  protocol: {
    id: string;
    organizationId: string;
    title: string;
    date: string;
    description: Value;
    version: number;
  };
}) {
  const router = useRouter();

  const [title, setTitle] = React.useState(protocol.title);
  const [date, setDate] = React.useState<Date | undefined>(
    protocol.date ? new Date(protocol.date) : undefined,
  );
  const [value, setValue] = React.useState<Value>(protocol.description ?? []);
  const [saving, setSaving] = React.useState(false);
  const [conflict, setConflict] = React.useState(false);
  const [activeEditors, setActiveEditors] = React.useState<ActiveEditor[]>([]);

  const versionRef = React.useRef(protocol.version);

  // Presence: Heartbeat + aktive Bearbeiter abfragen
  React.useEffect(() => {
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch(`/api/protocols/${protocol.id}/presence`, {
          method: "POST",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setActiveEditors(data.active ?? []);
      } catch {
        // still ignorieren – Presence ist unkritisch
      }
    }

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      // Beim Verlassen abmelden (SPA-Navigation). Tab-Close fängt der Timeout ab.
      fetch(`/api/protocols/${protocol.id}/presence`, {
        method: "DELETE",
        keepalive: true,
      }).catch(() => {});
    };
  }, [protocol.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setConflict(false);

    const res = await fetch(`/api/protocols/${protocol.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date: date ? format(date, "yyyy-MM-dd") : null,
        description: value,
        version: versionRef.current,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (res.status === 409) {
      setConflict(true);
      toastManager.add({
        title: "Konflikt",
        description:
          "Das Protokoll wurde zwischenzeitlich geändert. Bitte neu laden.",
        type: "error",
      });
      return;
    }

    if (!res.ok) {
      toastManager.add({
        title: "Fehler",
        description: data?.error ?? "Speichern fehlgeschlagen.",
        type: "error",
      });
      return;
    }

    // Erfolg: lokale Version hochzählen, weiterarbeiten möglich
    versionRef.current = data.version;
    toastManager.add({
      title: "Erfolg",
      description: "Protokoll erfolgreich aktualisiert.",
      type: "success",
    });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-5">
      {activeEditors.length > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-800/20 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
          <div className="-space-x-2 flex">
            {activeEditors.slice(0, 4).map((u) => (
              <Avatar key={u.id} className="size-7 ring-2 ring-amber-50">
                <AvatarImage src={u.avatarUrl ?? undefined} alt={u.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(u.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span>
            {activeEditors.length === 1
              ? `${activeEditors[0].name} bearbeitet dieses Protokoll gerade.`
              : activeEditors.length === 2
                ? `${activeEditors[0].name} und ${activeEditors[1].name} bearbeiten dieses Protokoll gerade.`
                : `${activeEditors[0].name}, ${activeEditors[1].name} und ${activeEditors.length - 2} andere Personen bearbeiten dieses Protokoll gerade.`}
          </span>
        </div>
      ) : null}

      {conflict ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <span>
            Dieses Protokoll wurde zwischenzeitlich geändert. Lade neu, um die
            aktuelle Version zu sehen – ungespeicherte Änderungen gehen dabei
            verloren.
          </span>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-full"
            onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" /> Neu laden
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field className="gap-2">
          <FieldLabel>Titel</FieldLabel>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field className="gap-2">
          <FieldLabel>Datum</FieldLabel>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className="w-full justify-start text-left font-normal"
                  variant="outline"
                />
              }>
              <CalendarIcon />
              {date ? (
                format(date, "PPP", { locale: de })
              ) : (
                <span> Datum auswählen</span>
              )}
            </PopoverTrigger>
            <PopoverPopup align="start" className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} />
            </PopoverPopup>
          </Popover>
        </Field>
      </div>

      <Label>Beschreibung</Label>
      <ProtocolEditor
        value={value}
        onChange={setValue}
        organizationId={protocol.organizationId}
      />

      <div className="flex justify-end">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? (
            <>
              <Spinner className="size-3" /> Loading...
            </>
          ) : (
            "Änderungen speichern"
          )}
        </Button>
      </div>
    </form>
  );
}
