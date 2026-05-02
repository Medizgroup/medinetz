/* eslint-disable @typescript-eslint/no-explicit-any */
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
import ActivityLine from "../activity/activity-line";

type Item = {
  id: string;
  action: ActivityAction;
  targetType: string;
  targetId: string;
  metadata: any;
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
                  src={item.user.avatarUrl ?? ""}
                />

                <TimelineContent className="text-foreground">
                  <ActivityLine
                    activity={{
                      action: item.action,
                      targetType: item.targetType,
                      targetId: (item as any).targetId ?? "",
                      metadata: ((item as any).metadata ?? {}) as any,
                      user: item.user,
                    }}
                  />
                  {item.organization?.name ? (
                    <span className="text-muted-foreground text-xs">
                      · {item.organization.name} ·{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      ·{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  )}
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
