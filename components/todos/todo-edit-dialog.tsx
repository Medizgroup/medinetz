"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export type TodoForEdit = {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  dueDate: string | null;
  done: boolean;
  targetType: string | null;
  targetId: string | null;
  targetLabel?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: TodoForEdit;
  onSaved: () => void;
};

export default function TodoEditDialog({
  open,
  onOpenChange,
  todo,
  onSaved,
}: Props) {
  const [title, setTitle] = React.useState(todo.title);
  const [description, setDescription] = React.useState(todo.description ?? "");
  const [priority, setPriority] = React.useState(String(todo.priority));
  const [dueDate, setDueDate] = React.useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : "",
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setPriority(String(todo.priority));
    setDueDate(
      todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : "",
    );
    setError(null);
  }, [open, todo]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Titel ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description || null,
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
    onSaved();
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!confirm("Todo wirklich löschen?")) return;
    const res = await fetch(`/api/todos/${todo.id}`, { method: "DELETE" });
    if (!res.ok) return;
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Todo bearbeiten</DialogTitle>
          <DialogDescription className="sr-only">
            Todo-Details bearbeiten
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 py-4">
            <Field className="gap-2">
              <FieldLabel>Titel</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Was muss getan werden?"
              />
            </Field>

            <Field className="gap-2">
              <FieldLabel>Beschreibung</FieldLabel>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Priorität</FieldLabel>
                <Select
                  items={[
                    { label: "Hoch", value: 3 },
                    { label: "Mittel", value: 2 },
                    { label: "Niedrig", value: 1 },
                  ]}
                  value={priority}
                  onValueChange={setPriority}>
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

            {todo.targetLabel ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  Verknüpft mit
                </div>
                <div>{todo.targetLabel}</div>
              </div>
            ) : null}
          </div>
        </DialogPanel>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="size-4" />
            Löschen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Speichern
            </Button>
          </div>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
