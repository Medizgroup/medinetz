"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QuickAddTodo() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState("2");
  const [dueDate, setDueDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setTitle("");
    setPriority("2");
    setDueDate("");
    setError(null);
  }

  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        priority: Number(priority),
        dueDate: dueDate || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    reset();
    setOpen(false);
    // Optional: window.location.reload() um den Header-Count zu aktualisieren
    // Bei nächstem Page-Wechsel wird's eh refresht. Wenn du sofortige Aktualisierung willst:
    if (typeof window !== "undefined") {
      // sanftes Hint, nicht Hard-Reload
      window.dispatchEvent(new Event("todos:changed"));
    }
  }

  return (
    <>
      <Button
        size="icon-xs"
        variant="outline"
        className="rounded-full"
        onClick={() => setOpen(true)}
        title="Schnell Todo hinzufügen">
        <Plus className="size-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}>
        <DialogPopup className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Neues Todo</DialogTitle>
            <DialogDescription className="sr-only">
              Schnell ein Todo hinzufügen
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {error ? (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSave} className="grid gap-4 py-4">
              <Field className="gap-2">
                <FieldLabel>Titel</FieldLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Was muss getan werden?"
                  autoFocus
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field className="gap-2">
                  <FieldLabel>Priorität</FieldLabel>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Hoch</SelectItem>
                      <SelectItem value="2">Mittel</SelectItem>
                      <SelectItem value="1">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="gap-2">
                  <FieldLabel>Fällig am</FieldLabel>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>
              </div>
            </form>
          </DialogPanel>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={!title.trim() || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
