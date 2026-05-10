/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";

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
import UserPicker from "./user-picker";
import { priorities_todos } from "@/lib/utils/todos/priority";
import { Badge } from "../ui/badge";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar } from "../ui/calendar";

export type TodoForEdit = {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  dueDate: Date | undefined;
  done: boolean;
  targetType: string | null;
  targetId: string | null;
  targetLabel?: string | null;
  creatorId: string;
  assigneeId: string | null;
  creator: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  assignee: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: TodoForEdit;
  currentUserId: string;
  onSaved: () => void;
};

export default function TodoEditDialog({
  open,
  onOpenChange,
  todo,
  currentUserId,
  onSaved,
}: Props) {
  const isCreator = todo.creatorId === currentUserId;
  const isAssignee = todo.assigneeId === currentUserId;

  const [title, setTitle] = React.useState(todo.title);
  const [description, setDescription] = React.useState(todo.description ?? "");
  const [priority, setPriority] = React.useState(todo.priority);
  const [dueDate, setDueDate] = React.useState<Date | undefined>(
    todo.dueDate ? new Date(todo.dueDate) : undefined,
  );
  const [assigneeId, setAssigneeId] = React.useState<string | null>(
    todo.assigneeId,
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setPriority(todo.priority);
    setDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined);
    setError(null);
  }, [open, todo]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Titel ist erforderlich.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = isCreator
      ? {
          title: title.trim(),
          description: description || null,
          priority: Number(priority),
          dueDate: dueDate || null,
          assigneeId,
        }
      : isAssignee
        ? { assigneeId: assigneeId ?? null } // Assignee darf sich nur selbst entfernen
        : {};

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      /* error handling wie gehabt */ return;
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
                placeholder="Worum geht es bei dieser Aufgabe?"
              />
            </Field>
            <Field className="gap-2">
              <FieldLabel>Zugewiesen an</FieldLabel>
              <UserPicker
                value={assigneeId}
                onChange={setAssigneeId}
                selectedUser={
                  todo.assignee
                    ? {
                        id: todo.assignee.id,
                        displayName:
                          todo.assignee.displayName ?? todo.assignee.name ?? "",
                        email: "",
                        avatarUrl: todo.assignee.avatarUrl,
                      }
                    : null
                }
                placeholder="Niemand (für alle sichtbar)"
              />
              {!isCreator && isAssignee ? (
                <p className="text-xs text-muted-foreground">
                  Du kannst dir das Todo selbst entfernen — nur der Ersteller
                  darf neu zuweisen.
                </p>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="gap-2">
                <FieldLabel>Priorität</FieldLabel>
                <Select
                  items={priorities_todos}
                  value={priority}
                  onValueChange={(value) => setPriority(value ?? 1)}>
                  <SelectTrigger>
                    <SelectValue>
                      {(() => {
                        const selectedPriority = priorities_todos.find(
                          (p) => p.value === priority,
                        );
                        return selectedPriority ? (
                          <span className="flex items-center gap-2">
                            <Badge variant={selectedPriority.variant} size="sm">
                              {selectedPriority.label}
                            </Badge>
                          </span>
                        ) : null;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorities_todos.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <span className="flex items-center gap-2">
                          <Badge variant={priority.variant} size="sm">
                            {priority.label}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field className="gap-2">
                <FieldLabel>Fällig am</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      />
                    }>
                    <CalendarIcon aria-hidden="true" />
                    {dueDate
                      ? format(dueDate, "PPP", { locale: de })
                      : "Datum auswählen"}
                  </PopoverTrigger>
                  <PopoverPopup>
                    <Calendar
                      defaultMonth={dueDate ? new Date(dueDate) : undefined}
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
          <Button
            variant="destructive-outline"
            className="rounded-xl"
            onClick={handleDelete}>
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
