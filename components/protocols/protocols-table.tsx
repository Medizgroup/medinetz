/* eslint-disable react-hooks/incompatible-library */
"use client";

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
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  MoreHorizontal,
  Plus,
  SearchIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { orgTypeBadge } from "@/lib/utils/cases";
import { SortVertical } from "@solar-icons/react-perf/category/arrows/LineDuotone/SortVertical";
import { Dialog, Library, SortFromBottomToTop, SortFromTopToBottom } from "@solar-icons/react-perf/category/style/LineDuotone";

type ProtocolRow = {
  id: string;
  title: string;
  protocolNumber: number;
  date: Date;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    type: "ROUTINE" | "PREGNANCY" | "MANAGEMENT" | "CUSTOM";
  };
  _count: {
    comments: number;
    protocolCases: number;
  };
};

export type OrgOption = {
  id: string;
  name: string;
  type: "ROUTINE" | "PREGNANCY" | "MANAGEMENT" | "CUSTOM";
};

export default function ProtocolsTable({
  data,
  orgOptions,
  adminOrgIds = [],
  canDeleteAll = false,
}: {
  data: ProtocolRow[];
  orgOptions: OrgOption[];
  adminOrgIds?: string[];
  canDeleteAll?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(data);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteTargets, setDeleteTargets] = useState<ProtocolRow[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setRows(data);
    setRowSelection({});
  }, [data]);

  const canDelete = useCallback(
    (organizationId: string) =>
      canDeleteAll || adminOrgIds.includes(organizationId),
    [canDeleteAll, adminOrgIds],
  );
  const canDeleteAny = canDeleteAll || adminOrgIds.length > 0;

  async function handleDelete() {
    if (deleteTargets.length === 0) return;
    setDeleting(true);
    try {
      const ids = deleteTargets.map((p) => p.id);
      const res = await fetch("/api/protocols/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Protokolle konnten nicht gelöscht werden.");
        return;
      }
      setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
      setRowSelection({});
      toast.success(
        body.deleted === 1
          ? "Protokoll gelöscht."
          : `${body.deleted} Protokolle gelöscht.`,
      );
      setDeleteTargets([]);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<ProtocolRow>[]>(
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
                    aria-label={`Protokoll #${row.original.protocolNumber} auswählen`}
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                  />
                </div>
              ),
            } satisfies ColumnDef<ProtocolRow>,
          ]
        : []),
      {
        accessorKey: "protocolNumber",
        header: "Nr.",
        cell: ({ row }) => (
          <div className="font-medium">#{row.original.protocolNumber}</div>
        ),
      },
      {
        accessorKey: "title",
        header: "Titel",
        filterFn: (row, _id, value: string) => {
          const v = value.toLowerCase().trim();

          return (
            row.original.title.toLowerCase().includes(v) ||
            row.original.protocolNumber.toString().includes(v)
          );
        },
        cell: ({ row }) => (
          <Link
            href={`/protocols/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "organization",
        accessorFn: (row) => row.organization.name,
        header: "Organisation",
        filterFn: (row, id, value) => {
          if (!value || value === "all") return true;
          return row.original.organization.id === value;
        },
        cell: ({ row }) => {
          const org = row.original.organization;
          const badge = orgTypeBadge(org.type);

          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-semibold",
                  badge.className,
                )}
                title={org.type}>
                {badge.label}
              </span>
              <span className="truncate">{org.name}</span>
            </div>
          );
        },
      },
      {
        id: "comments",
        accessorFn: (row) => row._count.comments,
        header: "Kommentare",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dialog className="size-4 text-amber-500" />
            <span>{row.original._count.comments}</span>
          </div>
        ),
      },
      {
        id: "cases",
        accessorFn: (row) => row._count.protocolCases,
        header: "Fälle",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Library className="size-4" />
            <span>{row.original._count.protocolCases}</span>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Datum",
        cell: ({ row }) =>
          format(new Date(row.original.date), "dd.MM.yyyy", { locale: de }),
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
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
    },
    enableRowSelection: (row) => canDelete(row.original.organization.id),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    enableSortingRemoval: false,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const titleColumn = table.getColumn("title");
  const orgColumn = table.getColumn("organization");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          {titleColumn && (
            <div className="w-full sm:w-72">
              <div className="relative">
                <Input
                  value={(titleColumn.getFilterValue() as string) ?? ""}
                  onChange={(e) => {
                    titleColumn.setFilterValue(e.target.value);
                  }}
                  placeholder="Nach Titel suchen"
                  className="ps-6"
                />
                <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center ps-3 text-muted-foreground">
                  <SearchIcon size={16} />
                </div>
              </div>
            </div>
          )}


          {orgColumn && (
            <div className="w-full sm:w-56">
              <Select
                aria-label="Organisation filtern"
                value={(orgColumn.getFilterValue() as string) ?? "all"}
                items={[
                  { label: "Alle Organisationen", value: "all" },
                  ...orgOptions.map((org) => ({
                    label: org.name,
                    value: org.id,
                  })),
                ]}
                onValueChange={(value) =>
                  orgColumn.setFilterValue(value === "all" ? undefined : value)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="all">Alle Organisationen</SelectItem>
                  {orgOptions.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          )}
        </div>

        <Button
          className="rounded-full"
          render={
            <Link href="/protocols/new">
              <Plus className="me-2 size-4" />
              Neues Protokoll erstellen
            </Link>
          }></Button>
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

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-2 font-medium">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <SortFromBottomToTop size={16} className="opacity-60" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <SortFromTopToBottom size={16} className="opacity-60" />
                        ) : <SortVertical className="size-5 " />}
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
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/protocols/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  Keine Protokolle gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">

            <span>Pro Seite</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectPopup>
            </Select>
          </div>


          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Zurück
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Weiter
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteTargets.length > 0}
        onOpenChange={(o) => !o && setDeleteTargets([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTargets.length === 1
                ? "Protokoll löschen?"
                : `${deleteTargets.length} Protokolle löschen?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTargets.length === 1
                ? `„${deleteTargets[0]?.title}“ wird`
                : "Die ausgewählten Protokolle werden"}{" "}
              unwiderruflich gelöscht, inklusive aller Kommentare, Uploads und
              Fall-Verknüpfungen. Dies kann nicht rückgängig gemacht werden.
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
