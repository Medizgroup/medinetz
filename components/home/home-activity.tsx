// components/home/home-activity.tsx
"use client";

import type { ActivityAction } from "@/generated/prisma/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

import {
  BookOpenIcon,
  PlusIcon,
  AtSign,
  Paperclip,
  CheckCircle2,
  RotateCcw,
  type LucideIcon,
  RefreshCcw,
  MessagesSquare,
} from "lucide-react";

import {
  Timeline,
  TimelineContent,
  TimelineItem,
} from "@/components/ui/timeline";

type Item = {
  id: string;
  action: ActivityAction;
  targetType: string;
  createdAt: Date;
  organization: { id: string; name: string } | null;
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
};

type Props = { items: Item[] };

function getActionIcon(action: ActivityAction): LucideIcon {
  switch (action) {
    case "CREATED":
      return PlusIcon;
    case "UPDATED":
      return RefreshCcw;
    case "COMMENTED":
      return MessagesSquare;
    case "ASSIGNED":
      return AtSign;
    case "CLOSED":
      return CheckCircle2;
    case "REOPENED":
      return RotateCcw;
    case "MENTIONED":
      return AtSign;
    case "ATTACHED":
      return Paperclip;
    default:
      return BookOpenIcon;
  }
}

function getActionText(action: ActivityAction, targetType: string): string {
  const t = targetType.toLowerCase();
  const entity = t.includes("case")
    ? "einen Fall"
    : t.includes("protocol")
      ? "ein Protokoll"
      : t.includes("comment")
        ? "einen Kommentar"
        : "einen Eintrag";

  switch (action) {
    case "CREATED":
      return `hat ${entity} erstellt`;
    case "UPDATED":
      return `hat ${entity} aktualisiert`;
    case "COMMENTED":
      return `hat ${entity} kommentiert`;
    case "ASSIGNED":
      return `hat ${entity} zugewiesen`;
    case "CLOSED":
      return `hat ${entity} geschlossen`;
    case "REOPENED":
      return `hat ${entity} wieder geöffnet`;
    case "MENTIONED":
      return `hat dich erwähnt (${entity})`;
    case "ATTACHED":
      return `hat einen Anhang hinzugefügt (${entity})`;
    default:
      return `hat eine Aktivität ausgeführt`;
  }
}

export default function HomeActivity({ items }: Props) {
  return (
    <div className="space-y-3 sm:col-span-3 p-4">
      <div className="font-medium text-muted-foreground text-sm">
        Aktivitäten
      </div>

      <Timeline>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine Aktivitäten.
          </div>
        ) : (
          items.map((item, idx) => {
            const ActionIcon = getActionIcon(item.action);
            const userLabel =
              item.user.displayName ||
              item.user.name ||
              `User ${item.user.id.slice(0, 6)}`;

            return (
              <TimelineItem
                className="m-0! flex-row items-center gap-3 py-2.5!"
                key={item.id}
                step={idx + 1}>
                <ActionIcon className="text-muted-foreground/80 size-5" />

                {/* Avatar */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={userLabel}
                  className="size-7 rounded-full"
                  src={
                    item.user.avatarUrl ??
                    `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(userLabel)}`
                  }
                />

                <TimelineContent className="text-foreground">
                  <Link
                    className="font-medium hover:underline"
                    href={`/m/${item.user.id}`}>
                    {userLabel}
                  </Link>

                  <span className="font-normal">
                    {" "}
                    {getActionText(item.action, item.targetType)}{" "}
                    {item.organization?.name ? (
                      <span className="text-muted-foreground">
                        · {item.organization.name}
                      </span>
                    ) : null}{" "}
                    <span className="text-muted-foreground">
                      ·{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </span>
                </TimelineContent>
              </TimelineItem>
            );
          })
        )}

        <Link
          href="/activity"
          className="text-muted-foreground text-sm pt-4 hover:underline">
          alle ansehen &#8594;
        </Link>
      </Timeline>
    </div>
  );
}
