/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TodoEditDialog, { type TodoForEdit } from "./todo-edit-dialog";
import UserPicker from "./user-picker";
import { priorities_todos, PRIORITY_LABEL } from "@/lib/utils/todos/priority";
import { getInitials } from "@/lib/helper/user";
import { Field, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";

type Todo = TodoForEdit;
type View = "mine" | "created" | "unassigned" | "all";

export default function TodosList({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const [items, setItems] = React.useState<Todo[]>([]);
  const [openCount, setOpenCount] = React.useState(0);
  const [doneCount, setDoneCount] = React.useState(0);
  const [mineOpen, setMineOpen] = React.useState(0);
  const [unassignedOpen, setUnassignedOpen] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [view, setView] = React.useState<View>("mine");
  const [filter, setFilter] = React.useState<"open" | "done" | "all">("open");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  const [newTitle, setNewTitle] = React.useState("");
  const [newPriority, setNewPriority] = React.useState(2);
  const [newDueDate, setNewDueDate] = React.useState<Date | undefined>();
  const [newAssigneeId, setNewAssigneeId] = React.useState<string | null>(
    currentUserId,
  );
  const [adding, setAdding] = React.useState(false);
  const [showQuickAddDetails, setShowQuickAddDetails] = React.useState(false);

  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("view", view);
      params.set("filter", filter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const r = await fetch(`/api/todos?${params.toString()}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items ?? []);
      setOpenCount(data.openCount ?? 0);
      setDoneCount(data.doneCount ?? 0);
      setMineOpen(data.mineOpen ?? 0);
      setUnassignedOpen(data.unassignedOpen ?? 0);
    } finally {
      setLoading(false);
    }
  }, [view, filter, priorityFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleQuickAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newTitle.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: Number(newPriority),
          dueDate: newDueDate || null,
          assigneeId: newAssigneeId,
        }),
      });
      if (!res.ok) return;
      setNewTitle("");
      setNewDueDate(undefined);
      setNewPriority(2);
      setNewAssigneeId(currentUserId);
      setShowQuickAddDetails(false);
      window.dispatchEvent(new Event("todos:changed"));
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function toggleDone(t: Todo) {
    setItems((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
    );
    setOpenCount((c) => (t.done ? c + 1 : Math.max(0, c - 1)));
    setDoneCount((c) => (t.done ? Math.max(0, c - 1) : c + 1));

    await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    }).catch(() => {});

    window.dispatchEvent(new Event("todos:changed"));
    if (filter !== "all") await load();
  }

  function openEdit(t: Todo) {
    setEditingTodo(t);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Quick-Add */}
      <form onSubmit={handleQuickAdd} className="space-y-2 hidden">
        <div className="grid gap-4">
          <Input
            value={newTitle}
            size="lg"
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Neues Todo…"
          />
          <Field className="w-full">
            <FieldLabel htmlFor="textarea-with-desc">Beschreibung</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id="textarea-with-desc"
              placeholder="Worum geht es bei dieser Aufgabe?"
              rows={6}
            />
          </Field>
          {/* <Button type="submit" disabled={!newTitle.trim() || adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : null}
            Hinzufügen
          </Button> */}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Select
            items={priorities_todos}
            value={newPriority}
            onValueChange={(v) => setNewPriority(v ?? 2)}>
            <SelectTrigger className="text-xs">
              <SelectValue>
                {(() => {
                  const selectedPriority = priorities_todos.find(
                    (p) => p.value === newPriority,
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
            <SelectPopup alignItemWithTrigger={false} className="w-auto">
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
          <Popover>
            <PopoverTrigger
              render={
                <Button className="w-full justify-start" variant="outline" />
              }>
              <CalendarIcon aria-hidden="true" />
              {newDueDate
                ? format(newDueDate, "PPP", { locale: de })
                : "Datum auswählen"}
            </PopoverTrigger>
            <PopoverPopup>
              <Calendar
                defaultMonth={newDueDate ? new Date(newDueDate) : undefined}
                mode="single"
                onSelect={setNewDueDate}
                selected={newDueDate}
              />
            </PopoverPopup>
          </Popover>

          <UserPicker
            value={newAssigneeId}
            onChange={setNewAssigneeId}
            placeholder={
              newAssigneeId ? "Default Benutzer" : "Für alle sichtbar"
            }
          />
        </div>

        <button
          type="button"
          onClick={() => setShowQuickAddDetails((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground">
          {showQuickAddDetails ? (
            <>
              <ChevronUp className="inline size-3" /> Details ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="inline size-3" /> Priorität, Frist &
              Zuweisung
            </>
          )}
        </button>
      </form>

      <Separator />
      {/* View-Tabs + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={view}
          items={[
            {
              value: "mine",
              label: (
                <span className="flex items-center gap-2">
                  Meine <Badge variant="secondary">{mineOpen}</Badge>
                </span>
              ),
            },
            {
              value: "unassigned",
              label: (
                <span className="flex items-center gap-2">
                  Offen für alle{" "}
                  <Badge variant="secondary">{unassignedOpen}</Badge>
                </span>
              ),
            },
            { value: "created", label: "Von mir erstellt" },
            { value: "all", label: "Alle sichtbaren" },
          ]}
          onValueChange={(v) => setView((v ?? "mine") as View)}>
          <SelectTrigger className="w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="mine" className="justify-between!">
              <span>Meine</span>
              <Badge variant="secondary">{mineOpen}</Badge>
            </SelectItem>
            <SelectItem value="unassigned">
              Offen für alle <Badge variant="secondary">{unassignedOpen}</Badge>
            </SelectItem>
            <SelectItem value="created">Von mir erstellt</SelectItem>
            <SelectItem value="all">Alle sichtbaren</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          value={filter}
          items={[
            {
              value: "open",
              label: (
                <span className="flex items-center gap-2">
                  Offen <Badge variant="secondary">{openCount}</Badge>
                </span>
              ),
            },
            {
              value: "done",
              label: (
                <span className="flex items-center gap-2">
                  Erledigt <Badge variant="secondary">{doneCount}</Badge>
                </span>
              ),
            },
            { value: "all", label: "Alle" },
          ]}
          onValueChange={(v) => setFilter((v ?? "open") as typeof filter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="open">
              Offen <Badge variant="secondary">{openCount}</Badge>
            </SelectItem>
            <SelectItem value="done">
              Erledigt <Badge variant="secondary">{doneCount}</Badge>
            </SelectItem>
            <SelectItem value="all">Alle</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          value={priorityFilter}
          items={[
            { value: "all", label: "Alle Prioritäten" },
            { value: "3", label: "Hoch" },
            { value: "2", label: "Mittel" },
            { value: "1", label: "Niedrig" },
          ]}
          onValueChange={(v) => setPriorityFilter(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Alle Prioritäten" />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="3">Hoch</SelectItem>
            <SelectItem value="2">Mittel</SelectItem>
            <SelectItem value="1">Niedrig</SelectItem>
          </SelectPopup>
        </Select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="w-full flex items-center justify-center text-muted-foreground gap-2 py-8">
          <Spinner className="size-4" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          {filter === "done"
            ? "Noch nichts erledigt."
            : view === "unassigned"
              ? "Keine offenen Aufgaben für alle."
              : "Keine offenen Todos."}
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            const isOverdue = due && !t.done && isPast(due) && !isToday(due);
            const isDueToday = due && !t.done && isToday(due);
            const isMine = t.assignee?.id === currentUserId;

            return (
              <li
                key={t.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3 transition-colors bg-muted/40 rounded-lg cursor-pointer hover:bg-muted",
                  isOverdue && "bg-destructive/10 hover:bg-destructive/15",
                  t.done && "opacity-60",
                )}>
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() => toggleDone(t)}
                  className="mt-0.5 "
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => openEdit(t)}>
                  <div className="flex items-start gap-2 flex-col">
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        t.done && "line-through",
                      )}>
                      {t.title}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {t.targetLabel ? (
                      <>
                        {due ? <span>·</span> : null}
                        <Link
                          href={
                            t.targetType === "case"
                              ? `/cases/${t.targetId}`
                              : t.targetType === "protocol"
                                ? `/protocols/${t.targetId}`
                                : "#"
                          }
                          className="hover:text-foreground hover:underline"
                          onClick={(e) => e.stopPropagation()}>
                          {t.targetLabel}
                        </Link>
                      </>
                    ) : null}

                    {t.description ? (
                      <>
                        <Badge
                          variant={
                            t.priority === 1
                              ? "info"
                              : t.priority === 2
                                ? "warning"
                                : "destructive"
                          }
                          size="sm">
                          {PRIORITY_LABEL[t.priority]}
                        </Badge>
                        <span className="truncate">{t.description}</span>
                      </>
                    ) : null}

                    {t.creator && t.creator.id !== currentUserId ? (
                      <span className="text-foreground">
                        erstellt von {t.creator.displayName ?? t.creator.name}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center text-xs text-muted-foreground">
                    {due ? (
                      <span
                        className={cn(
                          isOverdue && "text-red-500 font-medium",
                          isDueToday && "text-amber-500 font-medium",
                        )}>
                        {!isDueToday
                          ? format(due, "dd. MMM yyyy", { locale: de })
                          : null}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Assignee-Avatar */}
                {t.assignee ? (
                  <Avatar
                    className="size-6 shrink-0"
                    title={
                      isMine
                        ? "Dir zugewiesen"
                        : `Zugewiesen: ${t.assignee.displayName ?? t.assignee.name}`
                    }>
                    <AvatarImage src={t.assignee.avatarUrl ?? ""} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(
                        t.assignee.displayName ?? t.assignee.name ?? "?",
                      )}
                    </AvatarFallback>
                  </Avatar>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {editingTodo ? (
        <TodoEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          todo={editingTodo}
          currentUserId={currentUserId}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}
