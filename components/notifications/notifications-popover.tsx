/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { notificationIcon } from "./notification-icon";
import { notificationHref } from "@/lib/utils/notifications/notifications/links";
import { Bell } from "@/lib/icons";

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

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 Minuten

export default function NotificationsPopover() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const data = await r.json();
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // schluck
    }
  }, []);

  // Initial laden
  React.useEffect(() => {
    load();
  }, [load]);

  // Polling alle 60s (nur wenn Tab sichtbar)
  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      timer = setInterval(load, POLL_INTERVAL_MS);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        load();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // Beim Öffnen frisch laden
  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function handleClickItem(n: Notification) {
    // Optimistic mark-as-read
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
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  async function markAllRead() {
    setLoading(true);
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
    setLoading(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            aria-label="Benachrichtigungen"
            variant="ghost"
            className="relative rounded-full p-2!">
            <Bell className="size-5 text-muted-foreground" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground tabular-nums">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-[380px] p-0! relative"
        sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3 sticky -top-4 bg-popover z-10">
          <div className="flex items-center gap-2">
            <span className="font-medium">Benachrichtigungen</span>
            {unreadCount > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                {unreadCount}
              </span>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={markAllRead}
              disabled={loading}>
              <CheckCheck className="size-3.5" />
              Alle gelesen
            </Button>
          ) : null}
        </div>

        <div className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Keine Benachrichtigungen.
            </div>
          ) : (
            <ul className="space-y-3 mt-2">
              {items.map((n) => {
                const Icon = notificationIcon(n.type);
                const href = notificationHref(n.targetType, n.targetId);
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors cursor-pointer rounded-xl hover:bg-accent",
                      !n.read && "bg-primary/5",
                    )}
                    onClick={() => handleClickItem(n)}>
                    <div
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center",
                      )}>
                      <Icon className={cn("size-4 text-foreground")} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div
                        className={cn(
                          "text-sm leading-snug",
                          !n.read && "font-medium",
                        )}>
                        {n.title}
                      </div>
                      {n.message ? (
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {n.message}
                        </div>
                      ) : null}
                      <div className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </div>
                    </div>
                    {!n.read ? (
                      <span
                        aria-label="Ungelesen"
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
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
                          handleClickItem(n);
                        }}
                        className="block">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
              {items.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-center">
                    <Link
                      href="/notifications"
                      onClick={() => setOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground">
                      Alle Benachrichtigungen anzeigen
                    </Link>
                  </div>
                </>
              ) : null}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
