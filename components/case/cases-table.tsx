/* eslint-disable react-hooks/incompatible-library */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Download,
  MoreHorizontal,
  SearchIcon,
  Trash2,
  UserRoundX,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import {
  STATUS_LABEL,
  PRIORITY_LABEL,
  priorityVariant,
  statusColorClass,
  statusIcon,
} from "@/lib/utils/cases";
import { toCsv, downloadCsv } from "@/lib/utils/csv";
import type { CasePriority, CaseStatus } from "@/generated/prisma/client";
import { Button } from "../ui/button";
import UserAvatar from "../user/user-avatar";
import UserCombobox, { type UserComboboxUser } from "../user/user-combobox";
import {
  SortFromBottomToTop,
  SortFromTopToBottom,
  SortVertical,
} from "@solar-icons/react-perf/category/style/LineDuotone";

export type CaseRow = {
  id: string;
  caseNumber: number;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  totalCosts: number;
  patient: { pseudonym: string } | null;
  organization: { id: string; name: string };
  creator: { displayName: string | null; name: string | null };
  assignee: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  } | null;
};

type OrgOption = { id: string; name: string };

const ASSIGNEE_SPECIALS = [
  { value: "all", label: "Alle", icon: Users },
  { value: "unassigned", label: "Nicht zugewiesen", icon: UserRoundX },
];

function personName(p: { displayName: string | null; name: string | null }) {
  return p.displayName ?? p.name ?? "—";
}

export default function CasesTable({
  data,
  orgOptions,
  adminOrgIds = [],
  canDeleteAll = false,
  currentUserId,
}: {
  data: CaseRow[];
  orgOptions: OrgOption[];
  adminOrgIds?: string[];
  canDeleteAll?: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(data);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "caseNumber", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    {},
  );
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [search, setSearch] = React.useState("");
  const [assigneeFilter, setAssigneeFilter] = React.useState("all");
  const [deleteTargets, setDeleteTargets] = React.useState<CaseRow[]>([]);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setRows(data);
    setRowSelection({});
  }, [data]);

  const canDelete = React.useCallback(
    (organizationId: string) =>
      canDeleteAll || adminOrgIds.includes(organizationId),
    [canDeleteAll, adminOrgIds],
  );
  const canDeleteAny = canDeleteAll || adminOrgIds.length > 0;

  async function handleDelete() {
    if (deleteTargets.length === 0) return;
    setDeleting(true);
    try {
      const ids = deleteTargets.map((c) => c.id);
      const res = await fetch("/api/cases/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Fälle konnten nicht gelöscht werden.");
        return;
      }
      setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      setRowSelection({});
      toast.success(
        body.deleted === 1 ? "Fall gelöscht." : `${body.deleted} Fälle gelöscht.`,
      );
      setDeleteTargets([]);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const assigneeOptions = React.useMemo<UserComboboxUser[]>(() => {
    const map = new Map<string, UserComboboxUser>();
    for (const c of data) {
      if (c.assignee && !map.has(c.assignee.id)) {
        map.set(c.assignee.id, {
          id: c.assignee.id,
          name: personName(c.assignee),
          avatarUrl: c.assignee.avatarUrl,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "de"),
    );
  }, [data]);

  const columns = React.useMemo<ColumnDef<CaseRow>[]>(
    () => [
      ...(canDeleteAny
        ? [
            {
              id: "select",
              enableSorting: false,
              header: ({ table }) => (
                <Checkbox
                  aria-label="Alle auf dieser Seite auswählen"
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={
                    table.getIsSomePageRowsSelected() &&
                    !table.getIsAllPageRowsSelected()
                  }
                  onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                />
              ),
              cell: ({ row }) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    aria-label={`Fall #${row.original.caseNumber} auswählen`}
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                  />
                </div>
              ),
            } satisfies ColumnDef<CaseRow>,
          ]
        : []),
      {
        accessorKey: "caseNumber",
        header: "Nr.",
        cell: ({ row }) => (
          <div className="tabular-nums">#{row.original.caseNumber}</div>
        ),
      },
      {
        accessorKey: "title",
        header: "Titel",
        filterFn: (row, _id, value: string) => {
          const v = value.toLowerCase().trim();
          return (
            row.original.title.toLowerCase().includes(v) ||
            (row.original.patient?.pseudonym ?? "").toLowerCase().includes(v) ||
            row.original.caseNumber.toString().includes(v)
          );
        },
        cell: ({ row }) => (
          <Link
            href={`/cases/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-muted-foreground">
            {row.original.title}{" "}
            {row.original.status === "CLOSED" ? "(Abgeschlossen)" : ""}
          </Link>
        ),
      },
      {
        id: "patient",
        accessorFn: (row) => row.patient?.pseudonym ?? "",
        header: "Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original.patient?.pseudonym ?? "—"}
          </span>
        ),
      },
      {
        id: "assignee",
        accessorFn: (row) => (row.assignee ? personName(row.assignee) : ""),
        header: "Zugewiesen",
        filterFn: (row, _id, value) => {
          if (!value || value === "all") return true;
          if (value === "unassigned") return !row.original.assignee;
          return row.original.assignee?.id === value;
        },
        cell: ({ row }) =>
          row.original.assignee ? (
            <Link
              href={`/m/${row.original.assignee.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline">
              <UserAvatar
                name={personName(row.original.assignee)}
                avatarUrl={row.original.assignee.avatarUrl}
                size={24}
              />
              {personName(row.original.assignee)}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nicht zugewiesen
            </span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, _id, value) => {
          if (!value || value === "all") return true;
          return row.original.status === value;
        },
        cell: ({ row }) => {
          const Icon = statusIcon(row.original.status);
          return (
            <div className="flex items-center gap-2">
              <Icon
                className={cn("size-4", statusColorClass(row.original.status))}
              />
              <span className="text-sm text-muted-foreground">
                {STATUS_LABEL[row.original.status]}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priorität",
        filterFn: (row, _id, value) => {
          if (!value || value === "all") return true;
          return row.original.priority === value;
        },
        cell: ({ row }) => (
          <Badge variant={priorityVariant(row.original.priority)}>
            {PRIORITY_LABEL[row.original.priority]}
          </Badge>
        ),
      },
      {
        id: "organization",
        accessorFn: (row) => row.organization.name,
        header: "Organisation",
        filterFn: (row, _id, value) => {
          if (!value || value === "all") return true;
          return row.original.organization.id === value;
        },
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.organization.name}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          canDelete(row.original.organization.id) ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Aktionen"
                  onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTargets([row.original]);
                  }}>
                  <Trash2 className="size-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [canDelete, canDeleteAny],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, columnFilters, pagination, rowSelection },
    enableRowSelection: (row) => canDelete(row.original.organization.id),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    table.getColumn("title")?.setFilterValue(search);
    table.setPageIndex(0);
  }, [search, table]);

  React.useEffect(() => {
    table.getColumn("assignee")?.setFilterValue(assigneeFilter);
  }, [assigneeFilter, table]);

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  function exportCsv() {
    // Auswahl hat Vorrang, sonst alles, was die Filter gerade zeigen.
    // Bewusst ohne Patienten-Referenz: die Datei landet auf privaten Geräten.
    const exportRows = selectedRows.length
      ? selectedRows
      : table.getFilteredRowModel().rows.map((r) => r.original);
    const csv = toCsv(exportRows, [
      { header: "Nr.", value: (c) => c.caseNumber },
      { header: "Titel", value: (c) => c.title },
      { header: "Status", value: (c) => STATUS_LABEL[c.status] },
      { header: "Priorität", value: (c) => PRIORITY_LABEL[c.priority] },
      { header: "Organisation", value: (c) => c.organization.name },
      {
        header: "Zugewiesen",
        value: (c) => (c.assignee ? personName(c.assignee) : ""),
      },
      { header: "Erstellt von", value: (c) => personName(c.creator) },
      {
        header: "Erstellt am",
        value: (c) => format(new Date(c.createdAt), "dd.MM.yyyy"),
      },
      {
        header: "Frist",
        value: (c) => (c.dueDate ? format(new Date(c.dueDate), "dd.MM.yyyy") : ""),
      },
      {
        header: "Kosten (EUR)",
        value: (c) => c.totalCosts.toFixed(2).replace(".", ","),
      },
    ]);
    downloadCsv(`faelle-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 opacity-60" />
          <Input
            placeholder="Suche nach Titel oder Patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          items={[
            { label: "Alle Status", value: "all" },
            { label: "Offen", value: "OPEN" },
            { label: "In Bearbeitung", value: "IN_PROGRESS" },
            { label: "Wartend", value: "WAITING" },
            { label: "Abgeschlossen", value: "CLOSED" },
          ]}
          onValueChange={(v) => table.getColumn("status")?.setFilterValue(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="OPEN">Offen</SelectItem>
            <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
            <SelectItem value="WAITING">Wartend</SelectItem>
            <SelectItem value="CLOSED">Abgeschlossen</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          items={[
            { label: "Alle Prioritäten", value: "all" },
            { label: "Dringend", value: "URGENT" },
            { label: "Hoch", value: "HIGH" },
            { label: "Mittel", value: "MEDIUM" },
            { label: "Niedrig", value: "LOW" },
          ]}
          onValueChange={(v) => table.getColumn("priority")?.setFilterValue(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="URGENT">Dringend</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
            <SelectItem value="MEDIUM">Mittel</SelectItem>
            <SelectItem value="LOW">Niedrig</SelectItem>
          </SelectPopup>
        </Select>

        {orgOptions.length > 1 ? (
          <Select
            items={[
              { label: "Alle Organisationen", value: "all" },
              ...orgOptions.map((o) => ({ label: o.name, value: o.id })),
            ]}
            onValueChange={(v) =>
              table.getColumn("organization")?.setFilterValue(v)
            }>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Organisation" />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="all">Alle Organisationen</SelectItem>
              {orgOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        ) : null}

        <UserCombobox
          users={assigneeOptions}
          specialOptions={ASSIGNEE_SPECIALS}
          value={assigneeFilter}
          onValueChange={(v) => setAssigneeFilter(v ?? "all")}
          currentUserId={currentUserId}
          className="w-[220px]"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="ml-auto rounded-full"
              aria-label="Weitere Aktionen">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportCsv}>
              <Download className="size-4" />
              {selectedRows.length
                ? `${selectedRows.length} ausgewählte als CSV`
                : "Als CSV exportieren"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedRows.length > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {selectedRows.length} ausgewählt
          </span>
          <Button
            size="sm"
            variant="destructive-outline"
            onClick={() => setDeleteTargets(selectedRows)}>
            <Trash2 className="size-4" />
            Löschen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => table.resetRowSelection()}>
            Auswahl aufheben
          </Button>
        </div>
      ) : null}

      <div className="rounded-2xl">
        <Table>
          <TableHeader className="bg-muted/60">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === "select" ? "w-10" : undefined}>
                    {header.column.getCanSort() ? (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <SortFromBottomToTop className="size-4" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <SortFromTopToBottom className="size-4" />
                        ) : (
                          <SortVertical className="size-5" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(
                    "cursor-pointer hover:bg-muted/40",
                    row.original.status === "CLOSED" && "opacity-40",
                  )}
                  onClick={() => router.push(`/cases/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-12">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground">
                  Keine Fälle gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-1 pt-3 text-sm text-muted-foreground">
        <span>
          Seite {table.getState().pagination.pageIndex + 1} von{" "}
          {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getFilteredRowModel().rows.length} Fälle
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon className="size-4" />
            Zurück
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            Weiter
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteTargets.length > 0}
        onOpenChange={(o) => !o && setDeleteTargets([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargets.length === 1
                ? "Fall löschen?"
                : `${deleteTargets.length} Fälle löschen?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets.length === 1
                ? `„${deleteTargets[0]?.title}“ wird`
                : "Die ausgewählten Fälle werden"}{" "}
              unwiderruflich gelöscht, inklusive aller Kommentare, Kosten,
              Anhänge und Zuordnungen. Dies kann nicht rückgängig gemacht
              werden.
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
