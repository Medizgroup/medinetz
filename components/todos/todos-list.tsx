"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Loader2, Flag } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TodoEditDialog, { type TodoForEdit } from "./todo-edit-dialog";
import {
  PRIORITY_LABEL,
  priorityBgClass,
  priorityColorClass,
} from "@/lib/utils/todos/priority";

type Todo = TodoForEdit;

export default function TodosList() {
  const [items, setItems] = React.useState<Todo[]>([]);
  const [openCount, setOpenCount] = React.useState(0);
  const [doneCount, setDoneCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const [filter, setFilter] = React.useState<"open" | "done" | "all">("open");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  // Quick-Add
  const [newTitle, setNewTitle] = React.useState("");
  const [newPriority, setNewPriority] = React.useState("2");
  const [newDueDate, setNewDueDate] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [showQuickAddDetails, setShowQuickAddDetails] = React.useState(false);

  // Edit-Dialog
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
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
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter]);

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
        }),
      });
      if (!res.ok) return;
      setNewTitle("");
      setNewDueDate("");
      setNewPriority("2");
      setShowQuickAddDetails(false);
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function toggleDone(t: Todo) {
    // Optimistic
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

    // Reload (für Sortierung + falls Filter "open" gewählt ist soll es verschwinden)
    if (filter !== "all") {
      await load();
    }
  }

  function openEdit(t: Todo) {
    setEditingTodo(t);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Quick-Add */}
      <form onSubmit={handleQuickAdd} className="space-y-2 ">
        <div className="flex gap-2">
          <Input
            value={newTitle}
            size="lg"
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Neues Todo..."
          />
          <Button type="submit" disabled={!newTitle.trim() || adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : null}
            Hinzufügen
          </Button>
        </div>

        {showQuickAddDetails ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              items={[
                { value: "3", label: "Hoch" },
                { value: "2", label: "Mittel" },
                { value: "1", label: "Niedrig" },
              ]}
              value={newPriority}
              onValueChange={(v) => setNewPriority(v ?? "1")}>
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
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setShowQuickAddDetails((v) => !v)}
          className=" text-xs text-muted-foreground hover:text-foreground">
          {showQuickAddDetails ? (
            <>
              <ChevronUp className="inline size-3" /> Details ausblenden
            </>
          ) : (
            <>
              <ChevronDown className="inline size-3" /> Priorität & Frist
            </>
          )}
        </button>
      </form>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filter}
          items={[
            { value: "open", label: `Offen (${openCount})` },
            { value: "done", label: `Erledigt (${doneCount})` },
            { value: "all", label: "Alle" },
          ]}
          onValueChange={(v) => setFilter((v ?? "open") as typeof filter)}>
          <SelectTrigger className="w-[160px]">
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
            : filter === "open"
              ? "Keine offenen Todos. 🎉"
              : "Noch keine Todos."}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            const isOverdue = due && !t.done && isPast(due) && !isToday(due);
            const isDueToday = due && !t.done && isToday(due);

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
                  </div>
                </div>

                <Flag
                  className={cn(
                    "mt-1 size-3 shrink-0 opacity-0 transition group-hover:opacity-100",
                    priorityColorClass(t.priority),
                  )}
                />
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
          onSaved={load}
        />
      ) : null}
    </div>
  );
}
