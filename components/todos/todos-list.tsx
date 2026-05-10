/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { PRIORITY_LABEL, priorityBgClass } from "@/lib/utils/todos/priority";
import { getInitials } from "@/lib/helper/user";

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
  const [loading, setLoading] = React.useState(true);

  const [view, setView] = React.useState<View>("mine");
  const [filter, setFilter] = React.useState<"open" | "done" | "all">("open");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  const [newTitle, setNewTitle] = React.useState("");
  const [newPriority, setNewPriority] = React.useState("2");
  const [newDueDate, setNewDueDate] = React.useState("");
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
      setNewDueDate("");
      setNewPriority("2");
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
      <form onSubmit={handleQuickAdd} className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newTitle}
            size="lg"
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Neues Todo…"
          />
          <Button type="submit" disabled={!newTitle.trim() || adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : null}
            Hinzufügen
          </Button>
        </div>

        {showQuickAddDetails ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Select
              items={[
                { value: "3", label: "Hoch" },
                { value: "2", label: "Mittel" },
                { value: "1", label: "Niedrig" },
              ]}
              value={newPriority}
              onValueChange={(v) => setNewPriority(v ?? "2")}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Priorität" />
              </SelectTrigger>
              <SelectPopup alignItemWithTrigger={false} className="w-auto">
                <SelectItem value="3">Hoch</SelectItem>
                <SelectItem value="2">Mittel</SelectItem>
                <SelectItem value="1">Niedrig</SelectItem>
              </SelectPopup>
            </Select>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="text-xs"
              placeholder="Fällig am"
            />
            <UserPicker
              value={newAssigneeId}
              onChange={setNewAssigneeId}
              placeholder="Niemand (für alle)"
            />
          </div>
        ) : null}

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

      {/* View-Tabs + Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={view}
          items={[
            { value: "mine", label: `Meine (${mineOpen})` },
            {
              value: "unassigned",
              label: `Offen für alle (${unassignedOpen})`,
            },
            { value: "created", label: "Von mir erstellt" },
            { value: "all", label: "Alle sichtbaren" },
          ]}
          onValueChange={(v) => setView((v ?? "mine") as View)}>
          <SelectTrigger className="w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="mine">Meine ({mineOpen})</SelectItem>
            <SelectItem value="unassigned">
              Offen für alle ({unassignedOpen})
            </SelectItem>
            <SelectItem value="created">Von mir erstellt</SelectItem>
            <SelectItem value="all">Alle sichtbaren</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          value={filter}
          items={[
            { value: "open", label: `Offen (${openCount})` },
            { value: "done", label: `Erledigt (${doneCount})` },
            { value: "all", label: "Alle" },
          ]}
          onValueChange={(v) => setFilter((v ?? "open") as typeof filter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="open">Offen ({openCount})</SelectItem>
            <SelectItem value="done">Erledigt ({doneCount})</SelectItem>
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
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Lädt…
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
        <ul className="divide-y rounded-lg border">
          {items.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            const isOverdue = due && !t.done && isPast(due) && !isToday(due);
            const isDueToday = due && !t.done && isToday(due);
            const isUnassigned = !t.assignee;
            const isMine = t.assignee?.id === currentUserId;

            return (
              <li
                key={t.id}
                className={cn(
                  "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                  t.done && "opacity-60",
                )}>
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() => toggleDone(t)}
                  className="mt-0.5"
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => openEdit(t)}>
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full mt-1.5",
                        priorityBgClass(t.priority),
                      )}
                      title={`Priorität: ${PRIORITY_LABEL[t.priority]}`}
                    />
                    <span
                      className={cn(
                        "text-sm leading-snug",
                        t.done && "line-through",
                      )}>
                      {t.title}
                    </span>
                    {isUnassigned ? (
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Offen
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 ml-4 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    {due ? (
                      <span
                        className={cn(
                          isOverdue && "text-red-500 font-medium",
                          isDueToday && "text-amber-500 font-medium",
                        )}>
                        {isOverdue
                          ? "Überfällig: "
                          : isDueToday
                            ? "Heute"
                            : null}
                        {!isDueToday
                          ? format(due, "dd. MMM yyyy", { locale: de })
                          : null}
                      </span>
                    ) : null}

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
                        <span>·</span>
                        <span className="truncate">{t.description}</span>
                      </>
                    ) : null}

                    {t.creator && t.creator.id !== currentUserId ? (
                      <>
                        <span>·</span>
                        <span>
                          erstellt von {t.creator.displayName ?? t.creator.name}
                        </span>
                      </>
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
