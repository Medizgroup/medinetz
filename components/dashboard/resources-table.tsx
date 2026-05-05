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
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import ResourceFormDialog from "@/components/resources/resource-form-dialog";
import type { ResourceRow } from "@/lib/types/resources";

const AVAILABILITY_LABELS: Record<string, string> = {
  HIGH: "Hoch",
  MEDIUM: "Mittel",
  LOW: "Niedrig",
};

const AVAILABILITY_VARIANT: Record<string, "success" | "warning" | "info"> = {
  HIGH: "success",
  MEDIUM: "warning",
  LOW: "info",
};

export default function DashboardResourcesTable() {
  const [resources, setResources] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<
    "ALL" | "DOCTOR" | "INTERPRETER"
  >("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 30;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ResourceRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/resources");
      if (!r.ok) return;
      const data = await r.json();
      setResources([
        ...(data.doctors as ResourceRow[]),
        ...(data.interpreters as ResourceRow[]),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          r.name,
          r.address,
          r.phone,
          r.email,
          ...r.languages,
          ...r.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [resources, search, typeFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  async function handleDelete(r: ResourceRow) {
    if (!confirm(`„${r.name}" wirklich löschen?`)) return;
    const res = await fetch(`/api/resources/${r.type.toLowerCase()}/${r.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Fehler.");
      return;
    }
    toast.success("Gelöscht.");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche…"
              className="w-[240px] pl-6"
            />
          </div>
          <Select
            items={[
              { label: "Alle Typen", value: "ALL" },
              { label: "Ärzt:innen", value: "DOCTOR" },
              { label: "Dolmetscher:innen", value: "INTERPRETER" },
            ]}
            value={typeFilter}
            onValueChange={(v) =>
              setTypeFilter((v ?? "ALL") as typeof typeFilter)
            }>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="ALL">Alle Typen</SelectItem>
              <SelectItem value="DOCTOR">Ärzt:innen</SelectItem>
              <SelectItem value="INTERPRETER">Dolmetscher:innen</SelectItem>
            </SelectPopup>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}>
          <Plus className="size-4" />
          Hinzufügen
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Sprachen</TableHead>
              <TableHead>Verfügbarkeit</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Status</TableHead>
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
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground">
                  Keine Ressourcen gefunden.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((r) => (
                <TableRow
                  key={r.id}
                  className={!r.isActive ? "opacity-50" : ""}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      {r.type === "DOCTOR" && r.specialty ? (
                        <div className="text-xs text-muted-foreground">
                          {r.specialty}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.type === "DOCTOR" ? "info" : "secondary"}
                      className="text-[10px]">
                      {r.type === "DOCTOR" ? "Arzt" : "Dolmetscher"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.languages.slice(0, 3).map((l, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px]">
                          {l}
                        </Badge>
                      ))}
                      {r.languages.length > 3 ? (
                        <span className="text-[10px] text-muted-foreground">
                          +{r.languages.length - 3}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.availability ? (
                      <Badge
                        variant={
                          AVAILABILITY_VARIANT[r.availability] ?? "secondary"
                        }
                        className="text-[10px]">
                        {AVAILABILITY_LABELS[r.availability] ?? r.availability}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {r.address ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.isActive ? "success" : "secondary"}
                      className="text-[10px]">
                      {r.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(r);
                              setDialogOpen(true);
                            }}>
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(r)}>
                            Löschen
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

      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Seite {page} von {totalPages} · {filtered.length} Ressourcen
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

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType="DOCTOR"
        resource={editing}
        onSaved={load}
      />
    </div>
  );
}
