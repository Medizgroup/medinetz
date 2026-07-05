/* eslint-disable react-hooks/incompatible-library */
"use client";

import Link from "next/link";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  MessagesSquare,
  Plus,
  SearchIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}: {
  data: ProtocolRow[];
  orgOptions: OrgOption[];
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const columns = useMemo<ColumnDef<ProtocolRow>[]>(
    () => [
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
            className="font-medium hover:underline"
          >
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
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    enableSortingRemoval: false,
  });

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

      <div className="overflow-hidden ">
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
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    (window.location.href = `/protocols/${row.original.id}`)
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
                  Keine Protokolle gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">

            <span>
                pro Seite 
            </span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-5">
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
    </div>
  );
}
