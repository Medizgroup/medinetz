"use client";

import * as React from "react";
import { Plus, Loader2, CalendarIcon } from "lucide-react";

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
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserPicker from "../todos/user-picker";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { toastManager } from "../ui/toast";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { priorities_todos } from "@/lib/utils/todos/priority";
type Props = { currentUserId: string };

export default function QuickAddTodo({ currentUserId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState(2);
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [assigneeId, setAssigneeId] = React.useState<string | null>(
    currentUserId,
  );

  function reset() {
    setTitle("");
    setPriority(2);
    setDueDate(undefined);
    setAssigneeId(currentUserId);
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
        dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
        description: description,
        assigneeId,
      }),
    });

    setSaving(false);

    toastManager.add({
      title: res.ok ? "Erfolg" : "Fehler",
      description: res.ok
        ? "Todo wurde erfolgreich erstellt."
        : "Fehler beim Erstellen des Todos.",
      type: res.ok ? "success" : "error",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Speichern fehlgeschlagen.");
      return;
    }

    reset();
    setOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("todos:changed"));
    }
  }

  return (
    <>
      <Button
        size="icon-xs"
        variant="outline"
        onClick={() => setOpen(true)}
        className="group/fab relative flex rounded-full items-center overflow-hidden transition-[width] duration-300 ease-in-out hover:w-32">
        <Plus
          aria-hidden="true"
          className="size-4 absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover/fab:left-3 group-hover/fab:translate-x-0"
        />
        <span className="ml-8 pr-2 whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/fab:opacity-100">
          Todo erstellen
        </span>
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
              <div className="mx-auto w-full">
                <Field className="w-full">
                  <FieldLabel htmlFor="textarea-with-desc">
                    Beschreibung (optional)
                  </FieldLabel>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    id="textarea-with-desc"
                    placeholder="Worum geht es bei dieser Aufgabe?"
                    rows={6}
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field className="gap-2 sm:col-span-2">
                  <FieldLabel>Zugewiesen an</FieldLabel>
                  <UserPicker
                    value={assigneeId}
                    onChange={setAssigneeId}
                    placeholder={
                      assigneeId ? "Default Benutzer" : "Für alle sichtbar"
                    }
                  />
                </Field>
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
                              <Badge
                                variant={selectedPriority.variant}
                                size="sm">
                                {selectedPriority.label}
                              </Badge>
                            </span>
                          ) : null;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectPopup alignItemWithTrigger={false}>
                      {priorities_todos.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <span className="flex items-center gap-2">
                            <Badge variant={priority.variant} size="sm">
                              {priority.label}
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectPopup>
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
