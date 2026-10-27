/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardPanel } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "../ui/spinner";
import UserAvatar from "../user/user-avatar";

import TodoEditDialog, { type TodoForEdit } from "./todo-edit-dialog";
import { PRIORITY_LABEL } from "@/lib/utils/todos/priority";

type Todo = TodoForEdit;
type View = "mine" | "created" | "unassigned" | "all";

const PRIORITY_VARIANT: Record<number, "info" | "warning" | "error"> = {
  1: "info",
  2: "warning",
  3: "error",
};

function personName(p: { displayName: string | null; name: string | null }) {
  return p.displayName ?? p.name ?? "?";
}

function targetHref(t: Todo) {
  if (t.targetType === "case") return `/cases/${t.targetId}`;
  if (t.targetType === "protocol") return `/protocols/${t.targetId}`;
  return null;
}

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
  const [canDeleteAll, setCanDeleteAll] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [view, setView] = React.useState<View>("all");
  const [filter, setFilter] = React.useState<"open" | "done" | "all">("open");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [deleteTargets, setDeleteTargets] = React.useState<Todo[]>([]);
  const [deleting, setDeleting] = React.useState(false);

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
      setCanDeleteAll(Boolean(data.canDeleteAll));
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [view, filter, priorityFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Neue Todos aus dem Header-Schnellzugriff sofort übernehmen.
  React.useEffect(() => {
    const onChange = () => load();
    window.addEventListener("todos:changed", onChange);
    return () => window.removeEventListener("todos:changed", onChange);
  }, [load]);

  const canDelete = React.useCallback(
    (t: Todo) => canDeleteAll || t.creatorId === currentUserId,
    [canDeleteAll, currentUserId],
  );
  const deletable = items.filter(canDelete);
  const allSelected =
    deletable.length > 0 && deletable.every((t) => selected.has(t.id));
  const selectedTodos = items.filter((t) => selected.has(t.id));

  function toggleSelect(id: string, value: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function toggleDone(t: Todo) {
    setItems((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
    );
    setOpenCount((c) => (t.done ? c + 1 : Math.max(0, c - 1)));
    setDoneCount((c) => (t.done ? Math.max(0, c - 1) : c + 1));

    const res = await fetch(`/api/todos/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    }).catch(() => null);
    if (!res?.ok) toast.error("Status konnte nicht geändert werden.");

    window.dispatchEvent(new Event("todos:changed"));
  }

  async function handleDelete() {
    if (deleteTargets.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/todos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          ids: deleteTargets.map((t) => t.id),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Löschen fehlgeschlagen.");
        return;
      }
      toast.success(
        body.deleted === 1 ? "Todo gelöscht." : `${body.deleted} Todos gelöscht.`,
      );
      setDeleteTargets([]);
      setEditOpen(false);
      window.dispatchEvent(new Event("todos:changed"));
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(t: Todo) {
    setEditingTodo(t);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={view}
          items={[
            { value: "mine", label: `Meine (${mineOpen})` },
            { value: "unassigned", label: `Offen für alle (${unassignedOpen})` },
            { value: "created", label: "Von mir erstellt" },
            { value: "all", label: "Alle sichtbaren" },
          ]}
          onValueChange={(v) => setView((v ?? "mine") as View)}>
          <SelectTrigger className="w-[210px]">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false} className="w-auto">
            <SelectItem value="mine">
              Meine <Badge variant="secondary">{mineOpen}</Badge>
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
            { value: "open", label: `Offen (${openCount})` },
            { value: "done", label: `Erledigt (${doneCount})` },
            { value: "all", label: "Alle" },
          ]}
          onValueChange={(v) => setFilter((v ?? "open") as typeof filter)}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
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

      {selectedTodos.length > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {selectedTodos.length} ausgewählt
          </span>
          <Button
            size="sm"
            variant="destructive-outline"
            onClick={() => setDeleteTargets(selectedTodos)}>
            <Trash2 className="size-4" />
            Löschen
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Auswahl aufheben
          </Button>
        </div>
      ) : null}

      <Card className="p-0">
        <CardPanel className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Alle auswählen"
                    checked={allSelected}
                    indeterminate={selected.size > 0 && !allSelected}
                    disabled={deletable.length === 0}
                    onCheckedChange={(v) =>
                      setSelected(v ? new Set(deletable.map((t) => t.id)) : new Set())
                    }
                  />
                </TableHead>
                <TableHead>Todo</TableHead>
                <TableHead>Zugewiesen</TableHead>
                <TableHead>Fällig</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Spinner className="size-4" /> Lädt…
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground">
                    {filter === "done"
                      ? "Noch nichts erledigt."
                      : view === "unassigned"
                        ? "Keine offenen Aufgaben für alle."
                        : "Keine offenen Todos."}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((t) => (
                  <TodoRow
                    key={t.id}
                    todo={t}
                    currentUserId={currentUserId}
                    selected={selected.has(t.id)}
                    canDelete={canDelete(t)}
                    onSelect={(v) => toggleSelect(t.id, v)}
                    onToggleDone={() => toggleDone(t)}
                    onEdit={() => openEdit(t)}
                    onDelete={() => setDeleteTargets([t])}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardPanel>
      </Card>

      {editingTodo ? (
        <TodoEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          todo={editingTodo}
          currentUserId={currentUserId}
          onSaved={load}
          onDelete={
            canDelete(editingTodo)
              ? () => setDeleteTargets([editingTodo])
              : undefined
          }
        />
      ) : null}

      <AlertDialog
        open={deleteTargets.length > 0}
        onOpenChange={(o) => !o && setDeleteTargets([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargets.length === 1
                ? "Todo löschen?"
                : `${deleteTargets.length} Todos löschen?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets.length === 1
                ? `„${deleteTargets[0]?.title}“ wird`
                : "Die ausgewählten Todos werden"}{" "}
              endgültig gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargets([])}
              disabled={deleting}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}>
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TodoRow({
  todo: t,
  currentUserId,
  selected,
  canDelete,
  onSelect,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  currentUserId: string;
  selected: boolean;
  canDelete: boolean;
  onSelect: (value: boolean) => void;
  onToggleDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const due = t.dueDate ? new Date(t.dueDate) : null;
  const isOverdue = due && !t.done && isPast(due) && !isToday(due);
  const isDueToday = due && !t.done && isToday(due);
  const href = targetHref(t);

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className={cn("cursor-pointer", t.done && "opacity-60")}
      onClick={onEdit}>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={`„${t.title}“ auswählen`}
          checked={selected}
          disabled={!canDelete}
          onCheckedChange={(v) => onSelect(!!v)}
        />
      </TableCell>
      <TableCell className="max-w-md">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              t.done && "line-through",
            )}>
            {t.title}
          </span>
          <Badge variant={PRIORITY_VARIANT[t.priority] ?? "outline"} size="sm">
            {PRIORITY_LABEL[t.priority]}
          </Badge>
        </div>
        {t.targetLabel || (t.creator && t.creator.id !== currentUserId) ? (
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
            {t.targetLabel && href ? (
              <Link
                href={href}
                className="hover:text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}>
                {t.targetLabel}
              </Link>
            ) : null}
            {t.creator && t.creator.id !== currentUserId ? (
              <span>von {personName(t.creator)}</span>
            ) : null}
          </div>
        ) : null}
      </TableCell>
      <TableCell>
        {t.assignee ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={personName(t.assignee)}
              avatarUrl={t.assignee.avatarUrl}
              size={24}
            />
            <span className="text-sm">
              {t.assignee.id === currentUserId ? "Ich" : personName(t.assignee)}
            </span>
          </div>
        ) : (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> Für alle
          </span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {due ? (
          <span
            className={cn(
              "text-muted-foreground",
              isOverdue && "font-medium text-destructive",
              isDueToday && "font-medium text-warning-foreground",
            )}>
            {isDueToday
              ? "Heute"
              : format(due, "dd. MMM yyyy", { locale: de })}
            {isOverdue ? " · überfällig" : null}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Badge
          render={<button type="button" onClick={onToggleDone} />}
          variant={t.done ? "success" : "info"}
          size="sm"
          title={t.done ? "Wieder öffnen" : "Als erledigt markieren"}>
          {t.done ? "Erledigt" : "Offen"}
        </Badge>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Aktionen">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" />
              Bearbeiten
            </DropdownMenuItem>
            {canDelete ? (
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Löschen
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
