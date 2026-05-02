"use client";

import * as React from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import ActivityLine from "@/components/activity/activity-line";
import { detailedIcon } from "@/lib/utils/activities";
import { groupByDay } from "@/lib/utils/group-by-day";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/helper/user";

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
    | "ATTACHED";
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
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
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
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

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
  }, [page, orgFilter, actionFilter, targetTypeFilter, fromDate, toDate]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Filter-Änderung resettet Seite
  React.useEffect(() => {
    setPage(1);
  }, [orgFilter, actionFilter, targetTypeFilter, fromDate, toDate]);

  const groups = React.useMemo(
    () => (grouped ? groupByDay(items) : null),
    [grouped, items],
  );

  function resetFilters() {
    setOrgFilter("all");
    setActionFilter("all");
    setTargetTypeFilter("all");
    setFromDate("");
    setToDate("");
  }

  const hasFilters =
    orgFilter !== "all" ||
    actionFilter !== "all" ||
    targetTypeFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {orgs.length > 1 ? (
            <Select
              value={orgFilter}
              onValueChange={(v) => setOrgFilter(v ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Organisationen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Organisationen</SelectItem>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select
            value={actionFilter}
            onValueChange={(v) => setActionFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Aktionen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Aktionen</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={targetTypeFilter}
            onValueChange={(v) => setTargetTypeFilter(v ?? "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Bereiche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Bereiche</SelectItem>
              {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="Von"
              className="text-xs"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="Bis"
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setGrouped((g) => !g)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            {grouped ? "Chronologisch anzeigen" : "Nach Tag gruppieren"}
          </button>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Filter zurücksetzen
            </Button>
          ) : null}
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
                <ItemList items={g.items as ActivityItem[]} />
              </div>
            ))
          ) : (
            <ItemList items={items} />
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

function ItemList({ items }: { items: ActivityItem[] }) {
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
        const userName =
          a.user.displayName ?? a.user.name ?? `User ${a.user.id.slice(0, 6)}`;

        return (
          <li
            key={a.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={a.user.avatarUrl ?? undefined} alt={userName} />
              <AvatarFallback className="text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
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
          </li>
        );
      })}
    </ul>
  );
}
