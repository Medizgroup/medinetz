"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateOrgDialog from "./create-org-dialog";
import { toastManager } from "../ui/toast";
import { getInitials } from "@/lib/helper/user";
import Link from "next/link";

type Org = {
  id: string;
  name: string;
  slug: string;
  type: string;
  isArchived: boolean;
  createdAt: string;
  _count: { members: number; cases: number };
  members: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  }[];
};

const TYPE_LABELS: Record<string, string> = {
  ROUTINE: "Routine",
  PREGNANCY: "Schwangerschaft",
  MANAGEMENT: "Verwaltung",
  CUSTOM: "Sonstige",
};

export default function OrgsTable() {
  const [orgs, setOrgs] = React.useState<Org[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const pageSize = 30;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (debouncedSearch) params.set("search", debouncedSearch);
      const r = await fetch(`/api/admin/organizations?${params.toString()}`);
      if (!r.ok) return;
      const data = await r.json();
      setOrgs(data.orgs ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggleArchive(o: Org) {
    const r = await fetch(`/api/admin/organizations/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !o.isArchived }),
    });
    if (!r.ok) {
      toastManager.add({
        description: `Organisation konnte nicht ${!o.isArchived ? "archiviert" : "wiederhergestellt"} werden.`,
        title: "Error!",
        type: "error",
      });
      return;
    }

    toastManager.add({
      description: `Organisation ${!o.isArchived ? "archiviert" : "wiederhergestellt"}.`,
      title: "Success!",
      type: "success",
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Name oder Slug…"
            className="w-[280px] pl-6"
          />
        </div>
        <Button
          className="rounded-full"
          size="sm"
          onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Organisation erstellen
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Mitglieder</TableHead>
              <TableHead>Fälle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orgs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground">
                  Keine Organisationen gefunden.
                </TableCell>
              </TableRow>
            ) : (
              orgs.map((o) => (
                <TableRow
                  key={o.id}
                  className={o.isArchived ? "opacity-50" : ""}>
                  <TableCell>
                    <Link
                      href={`/dashboard/organizations/${o.id}`}
                      className="flex items-center gap-3 h-full">
                      <div className="font-medium">{o.name}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {TYPE_LABELS[o.type] ?? o.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{o._count.members}</TableCell>
                  <TableCell className="text-sm">{o._count.cases}</TableCell>
                  <TableCell>
                    <Badge
                      variant={o.isArchived ? "secondary" : "success"}
                      className="text-[10px]">
                      {o.isArchived ? "Archiviert" : "Aktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(o.createdAt), "dd.MM.yyyy", {
                      locale: de,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleArchive(o)}>
                            {o.isArchived ? "Wiederherstellen" : "Archivieren"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Seite {page} von {totalPages} · {total} Organisationen
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <CreateOrgDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
    </div>
  );
}
