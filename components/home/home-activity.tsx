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
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";
import ActivityLine from "../activity/activity-line";
import { detailedIcon } from "@/lib/utils/activities";

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

export default function HomeActivity({ items }: Props) {
  return (
    <div className="space-y-3 sm:col-span-3 p-4">
      <div className="font-medium text-muted-foreground text-sm dark:text-foreground/80">
        Folge die letzten Updates
      </div>

      <Timeline>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Noch keine Aktivitäten.
          </div>
        ) : (
          items.map((item, idx) => {
            const Icon = detailedIcon({
              action: item.action,
              targetType: item.targetType,
              targetId: item.targetId,
              metadata: (item.metadata ?? {}) as any,
              user: item.user,
            });
            return (
              <TimelineItem
                className="group-data-[orientation=vertical]/timeline:ms-10"
                key={item.id}
                step={idx + 1}>
                <TimelineHeader>
                  <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />

                  <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-5 items-center justify-center border-none bg-primary/10 group-data-completed/timeline-item:bg-primary/10 group-data-completed/timeline-item:text-foreground ">
                    <Icon size={12} />
                  </TimelineIndicator>
                </TimelineHeader>

                <TimelineContent>
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
                      in {item.organization.name}{" "}
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {" "}
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
          href="/activities"
          className="text-muted-foreground text-sm pt-4 hover:text-primary">
          alle ansehen &#8594;
        </Link>
      </Timeline>
    </div>
  );
}
