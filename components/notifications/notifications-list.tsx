"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { notificationIcon } from "./notification-icon";
import { groupByDay } from "@/lib/utils/group-by-day";
import { notificationHref } from "@/lib/utils/notifications/notifications/links";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  targetType: string | null;
  targetId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  MENTION: "Erwähnungen",
  ASSIGNMENT: "Zuweisungen",
  COMMENT: "Kommentare",
  CASE_UPDATE: "Fall-Updates",
  PROTOCOL_UPDATE: "Protokoll-Updates",
  EVENT_INVITE: "Termine",
};

export default function NotificationsList() {
  const router = useRouter();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [grouped, setGrouped] = React.useState(true);

  const load = React.useCallback(
    async (opts?: { reset?: boolean; cursor?: string }) => {
      const isReset = opts?.reset ?? false;
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set("filter", filter);
      params.set("limit", "30");
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (opts?.cursor) params.set("cursor", opts.cursor);

      try {
        const r = await fetch(`/api/notifications?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = await r.json();
        setUnreadCount(data.unreadCount ?? 0);
        setNextCursor(data.nextCursor ?? null);
        setItems((prev) => (isReset ? data.items : [...prev, ...data.items]));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter, typeFilter],
  );

  React.useEffect(() => {
    load({ reset: true });
  }, [load]);

  async function handleClickItem(n: Notification) {
    if (!n.read) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id
            ? { ...it, read: true, readAt: new Date().toISOString() }
            : it,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }

    const href = notificationHref(n.targetType, n.targetId);
    if (href) router.push(href);
  }

  async function markAllRead() {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        read: true,
        readAt: it.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  const groups = React.useMemo(
    () => (grouped ? groupByDay(items) : null),
    [grouped, items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sticky top-0 left-0 right-0 z-10 bg-background py-3">
        <div className="flex flex-row items-center gap-2">

        <Select
          items={[
            { label: "Alle", value: "all" },
            { label: "Ungelesen", value: "unread" },
          ]}
          value={filter}
          onValueChange={(v) => setFilter((v ?? "all") as "all" | "unread")}>
          <SelectTrigger>
            <SelectValue placeholder="Alle" />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="unread">Ungelesen</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          items={[
            { label: "Alle Typen", value: "all" },
            ...Object.entries(TYPE_LABELS).map(([k, v]) => ({
              label: v,
              value: k,
            })),
          ]}
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v ?? "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectPopup alignItemWithTrigger={false}>
            <SelectItem value="all">Alle Typen</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
        </div>

        <button
          type="button"
          onClick={() => setGrouped((g) => !g)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline">
          {grouped ? "Chronologisch" : "Nach Tag gruppiert"}
        </button>

        <div className="ml-auto flex items-center gap-3">
          {unreadCount > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {unreadCount} ungelesen
            </span>
          ) : null}
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck className="size-4" />
              Alle gelesen
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Lade Benachrichtigungen…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-sm text-muted-foreground">
          Keine Benachrichtigungen.
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
                <ItemList items={g.items} onClick={handleClickItem} />
              </div>
            ))
          ) : (
            <ItemList items={items} onClick={handleClickItem} />
          )}
        </div>
      )}

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => load({ cursor: nextCursor })}>
            {loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
            Mehr laden
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ItemList({
  items,
  onClick,
}: {
  items: Notification[];
  onClick: (n: Notification) => void;
}) {
  return (
    <ul className="divide-y">
      {items.map((n) => {
        const Icon = notificationIcon(n.type);
        const href = notificationHref(n.targetType, n.targetId);
        const Inner = (
          <div
            className={cn(
              "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
              !n.read && "bg-primary/5",
            )}
            onClick={() => onClick(n)}>
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                n.read ? "bg-muted" : "bg-primary/15",
              )}>
              <Icon
                className={cn(
                  "size-4",
                  n.read ? "text-foreground" : "text-primary",
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "text-sm leading-snug",
                  !n.read && "font-medium",
                )}>
                {n.title}
              </div>
              {n.message ? (
                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {n.message}
                </div>
              ) : null}
              <div className="mt-1 text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </div>
            </div>
            {!n.read ? (
              <span
                aria-label="Ungelesen"
                className="mt-2 size-2 shrink-0 rounded-full bg-emerald-500"
              />
            ) : null}
          </div>
        );

        return (
          <li key={n.id}>
            {href ? (
              <Link
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onClick(n);
                }}
                className="block">
                {Inner}
              </Link>
            ) : (
              Inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
