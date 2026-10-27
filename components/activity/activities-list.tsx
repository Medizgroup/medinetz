/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ActivityLine from "@/components/activity/activity-line";
import { detailedIcon } from "@/lib/utils/activities";
import { groupByDay } from "@/lib/utils/group-by-day";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "COMMENTED"
    | "ASSIGNED"
    | "CLOSED"
    | "REOPENED"
    | "MENTIONED"
    | "ATTACHED"
    | "DELETED";
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata: any;
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  organization: { id: string; name: string } | null;
};

type Org = { id: string; name: string };

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Erstellt",
  UPDATED: "Aktualisiert",
  COMMENTED: "Kommentiert",
  ASSIGNED: "Zugewiesen",
  CLOSED: "Geschlossen",
  REOPENED: "Wiedergeöffnet",
  MENTIONED: "Erwähnt",
  ATTACHED: "Anhang",
  DELETED: "Gelöscht",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  case: "Fälle",
  protocol: "Protokolle",
  case_comment: "Fall-Kommentare",
  protocol_comment: "Protokoll-Kommentare",
  event: "Termine",
};

export default function ActivitiesList() {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [orgs, setOrgs] = React.useState<Org[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Filter
  const [orgFilter, setOrgFilter] = React.useState("all");
  const [actionFilter, setActionFilter] = React.useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = React.useState("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [grouped, setGrouped] = React.useState(true);

  const pageSize = 30;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (orgFilter !== "all") params.set("organizationId", orgFilter);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (targetTypeFilter !== "all")
        params.set("targetType", targetTypeFilter);
      if (dateRange?.from) {
        params.set("from", format(dateRange.from, "yyyy-MM-dd"));
      }
      
      if (dateRange?.to) {
        params.set("to", format(dateRange.to, "yyyy-MM-dd"));
      }

      const r = await fetch(`/api/activities?${params.toString()}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setOrgs(data.orgs ?? []);
    } finally {
      setLoading(false);
    }
  }, [page, orgFilter, actionFilter, targetTypeFilter, dateRange]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Filter-Änderung resettet Seite
  React.useEffect(() => {
    setPage(1);
  }, [orgFilter, actionFilter, targetTypeFilter, dateRange]);

  const groups = React.useMemo(
    () => (grouped ? groupByDay(items) : null),
    [grouped, items],
  );

  async function hide(ids: string[]) {
    if (ids.length === 0) return;
    setItems((prev) => prev.filter((a) => !ids.includes(a.id)));
    setTotal((t) => Math.max(0, t - ids.length));
    const r = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => null);
    if (!r?.ok) {
      toast.error("Ausblenden fehlgeschlagen.");
      load();
    }
  }

  async function restoreAll() {
    const r = await fetch("/api/activities", { method: "DELETE" }).catch(
      () => null,
    );
    const data = await r?.json().catch(() => null);
    if (!r?.ok) {
      toast.error("Wiederherstellen fehlgeschlagen.");
      return;
    }
    toast.success(
      data?.restored
        ? `${data.restored} Einträge wieder eingeblendet.`
        : "Keine ausgeblendeten Einträge.",
    );
    load();
  }

  function resetFilters() {
    setOrgFilter("all");
    setActionFilter("all");
    setTargetTypeFilter("all");
    setDateRange(undefined);
  }

  const hasFilters =
    orgFilter !== "all" ||
    actionFilter !== "all" ||
    targetTypeFilter !== "all" ||
    dateRange?.from ||
    dateRange?.to

  return (
    <div className="space-y-4">
      <div className="space-y-3 py-3 sticky top-0 left-0 right-0 z-10 bg-white dark:bg-background">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {orgs.length > 1 ? (
            <Select
              items={[
                { label: "Alle Organisationen", value: "all" },
                ...orgs.map((o) => ({ label: o.name, value: o.id })),
              ]}
              value={orgFilter}
              onValueChange={(v) => setOrgFilter(v ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Organisationen" />
              </SelectTrigger>
              <SelectPopup alignItemWithTrigger={false}>
                <SelectItem value="all">Alle Organisationen</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          ) : null}

          <Select
            value={actionFilter}
            items={[
              { label: "Alle Aktionen", value: "all" },
              ...Object.entries(ACTION_LABELS).map(([k, v]) => ({
                label: v,
                value: k,
              })),
            ]}
            onValueChange={(v) => setActionFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Aktionen" />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          <Select
            items={[
              { label: "Alle Bereiche", value: "all" },
              ...Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => ({
                label: v,
                value: k,
              })),
            ]}
            value={targetTypeFilter}
            onValueChange={(v) => setTargetTypeFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Bereiche" />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="all">Alle Bereiche</SelectItem>
              {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          <Popover>
  <PopoverTrigger render={<Button   variant="outline"
      className="justify-start text-left font-normal" /> }>
  
      <CalendarIcon className="mr-2 h-4 w-4" />

      {dateRange?.from ? (
        dateRange.to ? (
          <>
            {format(dateRange.from, "dd.MM.yyyy")} -{" "}
            {format(dateRange.to, "dd.MM.yyyy")}
          </>
        ) : (
          format(dateRange.from, "dd.MM.yyyy")
        )
      ) : (
        <span>Zeitraum auswählen</span>
      )}
  </PopoverTrigger>

  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={setDateRange}
      numberOfMonths={2}
      initialFocus
    />
  </PopoverContent>
</Popover>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setGrouped((g) => !g)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            {grouped ? "Chronologisch anzeigen" : "Nach Tag gruppieren"}
          </button>

          <div className="flex items-center gap-1">
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Filter zurücksetzen
              </Button>
            ) : null}
            {items.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => hide(items.map((a) => a.id))}>
                <EyeOff className="size-4" />
                Diese Seite ausblenden
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={restoreAll}>
              <RotateCcw className="size-4" />
              Ausgeblendete anzeigen
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Lade Aktivitäten…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Keine Aktivitäten gefunden.
        </div>
      ) : (
        <div className="rounded-lg border">
          {grouped && groups ? (
            groups.map((g, gi) => (
              <div key={g.label}>
                <div
                  className={cn(
                    "border-b bg-muted/30 px-4 py-2 text-xs font-medium uppercase text-muted-foreground",
                    gi > 0 && "border-t",
                  )}>
                  {g.label}
                </div>
                <ItemList
                  items={g.items as ActivityItem[]}
                  onHide={(id) => hide([id])}
                />
              </div>
            ))
          ) : (
            <ItemList items={items} onHide={(id) => hide([id])} />
          )}
        </div>
      )}

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
              Zurück
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Weiter
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemList({
  items,
  onHide,
}: {
  items: ActivityItem[];
  onHide: (id: string) => void;
}) {
  return (
    <ul className="divide-y">
      {items.map((a) => {
        const Icon = detailedIcon({
          action: a.action,
          targetType: a.targetType,
          targetId: a.targetId,
          metadata: a.metadata ?? {},
          user: a.user,
        });
        return (
          <li
            key={a.id}
            className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
            <Icon className="mt-0.5 size-5.5 shrink-0 text-muted-foreground" />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2">
                
                <div className="min-w-0 flex-1 text-sm">
                  <ActivityLine
                    activity={{
                      action: a.action,
                      targetType: a.targetType,
                      targetId: a.targetId,
                      metadata: a.metadata ?? {},
                      user: a.user,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                {a.organization ? <span>{a.organization.name}</span> : null}
                <span>·</span>
                <span
                  title={format(new Date(a.createdAt), "dd.MM.yyyy HH:mm", {
                    locale: de,
                  })}>
                  {formatDistanceToNow(new Date(a.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              title="Für mich ausblenden"
              aria-label="Für mich ausblenden"
              onClick={() => onHide(a.id)}>
              <EyeOff className="size-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
