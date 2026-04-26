"use client";

import * as React from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
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
  STATUS_LABEL,
  PRIORITY_LABEL,
  priorityVariant,
  statusColorClass,
  statusIcon,
} from "@/lib/utils/cases";
import type { CasePriority, CaseStatus } from "@/generated/prisma/client";

type CaseRow = {
  id: string;
  caseNumber: number;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  patientPseudonym: string;
  createdAt: Date;
  updatedAt: Date;
  organization: { id: string; name: string };
  creator: { displayName: string | null; name: string | null };
  assignee: {
    id: string;
    displayName: string | null;
    name: string | null;
  } | null;
  _count: { comments: number };
};

type OrgOption = { id: string; name: string };

export default function CasesTable({
  data,
  orgOptions,
}: {
  data: CaseRow[];
  orgOptions: OrgOption[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [search, setSearch] = React.useState("");

  const columns = React.useMemo<ColumnDef<CaseRow>[]>(
    () => [
      {
        accessorKey: "caseNumber",
        header: "Nr.",
        cell: ({ row }) => (
          <div className="font-medium tabular-nums">
            #{row.original.caseNumber}
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Titel",
        filterFn: (row, _id, value: string) => {
          const v = value.toLowerCase();
          return (
            row.original.title.toLowerCase().includes(v) ||
            row.original.patientPseudonym.toLowerCase().includes(v)
          );
        },
        cell: ({ row }) => (
          <Link
            href={`/cases/${row.original.id}`}
            className="font-medium hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "patient",
        accessorFn: (row) => row.patientPseudonym,
        header: "Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original.patientPseudonym}
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
              <span className="text-sm">
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
          <span className="truncate text-sm">
            {row.original.organization.name}
          </span>
        ),
      },
      {
        id: "assignee",
        accessorFn: (row) =>
          row.assignee?.displayName ?? row.assignee?.name ?? "—",
        header: "Zugewiesen",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.assignee?.displayName ??
              row.original.assignee?.name ??
              "—"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Aktualisiert",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(row.original.updatedAt, "dd.MM.yyyy", { locale: de })}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  React.useEffect(() => {
    table.getColumn("title")?.setFilterValue(search);
  }, [search, table]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60" />
          <Input
            placeholder="Suche nach Titel oder Patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          onValueChange={(v) => table.getColumn("status")?.setFilterValue(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="OPEN">Offen</SelectItem>
            <SelectItem value="IN_PROGRESS">In Bearbeitung</SelectItem>
            <SelectItem value="WAITING">Wartend</SelectItem>
            <SelectItem value="CLOSED">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => table.getColumn("priority")?.setFilterValue(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            <SelectItem value="URGENT">Dringend</SelectItem>
            <SelectItem value="HIGH">Hoch</SelectItem>
            <SelectItem value="MEDIUM">Mittel</SelectItem>
            <SelectItem value="LOW">Niedrig</SelectItem>
          </SelectContent>
        </Select>

        {orgOptions.length > 1 ? (
          <Select
            onValueChange={(v) =>
              table.getColumn("organization")?.setFilterValue(v)
            }>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Organisation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Organisationen</SelectItem>
              {orgOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="rounded-2xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.column.getCanSort() ? (
                      <button
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUpIcon size={14} className="opacity-60" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDownIcon size={14} className="opacity-60" />
                        ) : null}
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
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    (window.location.href = `/cases/${row.original.id}`)
                  }>
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
                  Keine Fälle gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
