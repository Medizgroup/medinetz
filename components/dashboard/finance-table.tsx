"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { de } from "date-fns/locale";
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
import { Card, CardContent } from "@/components/ui/card";

import FinanceItemDialog from "./finance-item-dialog";
import { cn } from "@/lib/utils";
import { toastManager } from "../ui/toast";

type Org = { id: string; name: string };

type DonationItem = {
  id: string;
  donorName: string | null;
  amount: number;
  donationDate: string;
  isAnonymous: boolean;
  receiptSent: boolean;
  notes: string | null;
  organizationId: string | null;
  organization: { name: string } | null;
};

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  category: string | null;
  isPaid: boolean;
  notes: string | null;
  organizationId: string;
  organization: { name: string } | null;
};

export default function FinanceTable({
  availableOrgs,
}: {
  availableOrgs: Org[];
}) {
  const [tab, setTab] = React.useState<"donations" | "expenses">("donations");
  const [items, setItems] = React.useState<(DonationItem | ExpenseItem)[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalAmount, setTotalAmount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [orgFilter, setOrgFilter] = React.useState("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<
    DonationItem | ExpenseItem | null
  >(null);

  const pageSize = 30;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orgFilter, tab]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (orgFilter !== "all") params.set("org", orgFilter);

      const r = await fetch(`/api/admin/finance/${tab}?${params.toString()}`);
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalAmount(data.totalAmount ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, orgFilter, tab]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    const r = await fetch(`/api/admin/finance/${tab}/${id}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      toastManager.add({
        description: "Der Eintrag konnte nicht gelöscht werden.",
        title: "Fehler",
        type: "error",
      });
      return;
    }
    toastManager.add({
      description: "Der Eintrag wurde gelöscht.",
      title: "Success!",
      type: "success",
    });
    load();
  }

  function handleExport() {
    window.open(`/api/admin/finance/${tab}/export`, "_blank");
  }

  const isDonation = tab === "donations";

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {(["donations", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t === "donations" ? "Spenden" : "Ausgaben"}
          </button>
        ))}
      </div>

      <Card className="rounded-none! border-0! shadow-none! py-0 inline-flex">
        <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Gesamt
          </div>
          <div
            className={cn(
              "tabular-nums text-xs font-medium",
              isDonation
                ? "text-green-800 dark:text-green-400"
                : "text-red-800 dark:text-red-400",
            )}>
            {isDonation ? (
              <TrendingUp className="size-4 inline-block" />
            ) : (
              <TrendingUp className="size-4 inline-block rotate-180" />
            )}
          </div>
          <div className="tabular-nums w-full flex-none text-3xl font-semibold tracking-tight text-foreground">
            {totalAmount.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
        </CardContent>
      </Card>

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
          {availableOrgs.length > 1 ? (
            <Select
              value={orgFilter}
              items={[
                { value: "all", label: "Alle Organisationen" },
                ...availableOrgs.map((o) => ({ value: o.id, label: o.name })),
              ]}
              onValueChange={(v) => setOrgFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Orgs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Organisationen</SelectItem>
                {availableOrgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null);
              setCreateOpen(true);
            }}>
            <Plus className="size-4" />
            Hinzufügen
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {isDonation ? (
                <>
                  <TableHead>Spender:in</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Quittung</TableHead>
                  <TableHead>Organisation</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organisation</TableHead>
                </>
              )}
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground">
                  Keine Einträge.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                if (isDonation) {
                  const d = item as DonationItem;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        {d.isAnonymous ? (
                          <span className="text-muted-foreground italic">
                            Anonym
                          </span>
                        ) : (
                          (d.donorName ?? "—")
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {d.amount.toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          if (!d.donationDate) return "—";

                          const date = parseISO(d.donationDate);

                          return isValid(date)
                            ? format(date, "dd.MM.yyyy", { locale: de })
                            : "—";
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={d.receiptSent ? "success" : "secondary"}
                          className="text-[10px]">
                          {d.receiptSent ? "Gesendet" : "Ausstehend"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.organization?.name ?? "Allgemein"}
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
                                  setEditingItem(d);
                                  setCreateOpen(true);
                                }}>
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(d.id)}>
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  const e = item as ExpenseItem;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {e.description}
                          </div>
                          {e.vendor ? (
                            <div className="text-xs text-muted-foreground">
                              {e.vendor}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {e.amount.toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          if (!e.expenseDate) return "—";

                          const date = parseISO(e.expenseDate);

                          return isValid(date)
                            ? format(date, "dd.MM.yyyy", { locale: de })
                            : "—";
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={e.isPaid ? "success" : "warning"}
                          className="text-[10px]">
                          {e.isPaid ? "Bezahlt" : "Offen"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.organization?.name ?? "—"}
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
                                  setEditingItem(e);
                                  setCreateOpen(true);
                                }}>
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(e.id)}>
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Seite {page} von {totalPages} · {total} Einträge
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

      <FinanceItemDialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) setEditingItem(null);
        }}
        tab={tab}
        item={editingItem}
        availableOrgs={availableOrgs}
        onSaved={load}
      />
    </div>
  );
}
