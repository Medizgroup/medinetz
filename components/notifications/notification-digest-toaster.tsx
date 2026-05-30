"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toastManager } from "../ui/toast";

type DigestItem = {
  id: string;
  kind: "todo" | "event" | "invite" | "join" | "inactive";
  dedup: "daily" | "once";
  href: string;
  title?: string;
  orgName?: string;
  userLabel?: string;
  dueDate?: string | null;
  startsAt?: string | null;
  allDay?: boolean;
  location?: string | null;
  overdue?: boolean;
};

type Digest = {
  todosToday: DigestItem[];
  eventsToday: DigestItem[];
  pendingInvites: DigestItem[];
  pendingApprovals: DigestItem[];
};

const SEEN_KEY = "notif-digest-seen-v1";
const todayStr = () => new Date().toISOString().slice(0, 10);

function loadSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveSeen(seen: Record<string, string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // ignore
  }
}
// "daily"-Einträge älter als 14 Tage entfernen, "once" bleibt
function prune(seen: Record<string, string>) {
  const cut = new Date();
  cut.setDate(cut.getDate() - 14);
  const cutStr = cut.toISOString().slice(0, 10);
  for (const [k, v] of Object.entries(seen)) {
    if (v !== "once" && v < cutStr) delete seen[k];
  }
}

function metaFor(it: DigestItem) {
  switch (it.kind) {
    case "todo":
      return {
        title: it.overdue ? "Todo überfällig" : "Todo heute fällig",
        description: it.title ?? "",
        action: "Öffnen",
        type: it.overdue ? "error" : "info",
      };
    case "event": {
      const time =
        it.allDay || !it.startsAt
          ? "ganztägig"
          : format(new Date(it.startsAt), "HH:mm") + " Uhr";
      return {
        title: "Termin heute",
        description: `${it.title ?? ""} · ${time}${it.location ? " · " + it.location : ""}`,
        action: "Kalendar",
        type: "warning",
      };
    }
    case "invite":
      return {
        title: "Einladung",
        description: `Du wurdest zu „${it.orgName}" eingeladen.`,
        action: "Ansehen",
        type: "info",
      };
    case "join":
      return {
        title: "Beitrittsanfrage",
        description: `${it.userLabel} möchte „${it.orgName}" beitreten.`,
        action: "Prüfen",
        type: "info",
      };
    case "inactive":
      return {
        title: "Freischaltung ausstehend",
        description: `${it.userLabel} wartet auf Freischaltung.`,
        action: "Verwalten",
        type: "info",
      };
  }
}
export default function NotificationDigestToaster() {
  const router = useRouter();
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return; // StrictMode-Doppel-Mount abfangen
    ran.current = true;

    (async () => {
      try {
        const r = await fetch("/api/notifications/digest", {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data: Digest = await r.json();

        // Wichtige zuerst
        const items: DigestItem[] = [
          ...data.pendingApprovals,
          ...data.pendingInvites,
          ...data.todosToday,
          ...data.eventsToday,
        ];

        const seen = loadSeen();
        prune(seen);
        const today = todayStr();

        const toShow = items.filter((it) =>
          it.dedup === "once" ? !seen[it.id] : seen[it.id] !== today,
        );

        toShow.forEach((it, idx) => {
          const meta = metaFor(it);
          setTimeout(() => {
            toastManager.add({
              id: it.id, // stabile ID = Upsert statt Doppel-Stack
              title: meta.title,
              description: meta.description,
              timeout: it.dedup === "once" ? 18000 : 8000,
              type: meta.type,
              actionProps: {
                children: meta.action,
                onClick: () => router.push(it.href),
              },
            });

            // ! Sound
            const audio = new Audio("/sound/notify.mp3");
            audio.volume = 0.6;
            audio.play().catch(() => {
              // vom Browser blockiert (kein User-Gesture) – einfach ignorieren
            });
            //!   End Sound
          }, idx * 350);
        });

        // sofort als gesehen markieren (kein Re-Toast bei Reload)
        toShow.forEach((it) => {
          seen[it.id] = it.dedup === "once" ? "once" : today;
        });
        saveSeen(seen);
      } catch {
        // still
      }
    })();
  }, [router]);

  return null;
}
