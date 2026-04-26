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
import AssigneeFilter, { type AssigneeOption } from "./assignee-filter";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
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

  const assigneeOptions = React.useMemo<AssigneeOption[]>(() => {
    const map = new Map<string, AssigneeOption>();
    for (const c of data) {
      if (c.assignee?.id) {
        const name =
          c.assignee.displayName ??
          c.assignee.name ??
          `User ${c.assignee.id.slice(0, 6)}`;
        if (!map.has(c.assignee.id)) {
          map.set(c.assignee.id, { id: c.assignee.id, name });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "de"),
    );
  }, [data]);

  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

  const columns = React.useMemo<ColumnDef<CaseRow>[]>(
    () => [
      {
        accessorKey: "caseNumber",
        header: "Nr.",
        cell: ({ row }) => (
          <div
            className={`tabular-nums ${row.original.status === "CLOSED" ? "line-through" : ""}`}>
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
            className={`hover:text-muted-foreground ${row.original.status === "CLOSED" ? "line-through" : ""}`}>
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
        id: "assignee",
        accessorFn: (row) => row.assignee?.id ?? "__none__",
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
              className="text-sm text-muted-foreground hover:text-primary hover:underline">
              {row.original.assignee.displayName ??
                row.original.assignee.name ??
                "—"}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
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

  React.useEffect(() => {
    table.getColumn("assignee")?.setFilterValue(assigneeFilter);
  }, [assigneeFilter, table]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-60 z-10" />
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
          <SelectPopup>
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

        {/* Select für zugewiesene Person */}
        <AssigneeFilter
          options={assigneeOptions}
          value={assigneeFilter}
          onChange={setAssigneeFilter}
        />
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
    </div>
  );
}
