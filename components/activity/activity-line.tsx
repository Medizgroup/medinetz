import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { describeActivity, actorName } from "@/lib/utils/activities";
import type { ActivityForDisplay } from "@/lib/utils/activities";
import { getInitials } from "@/lib/helper/user";
import UserDefaultAvatar from "../user/user-default-avatar";

export default function ActivityLine({
  activity,
}: {
  activity: ActivityForDisplay;
}) {
  const pieces = describeActivity(activity);
  const actor = actorName(activity.user);

  return (
    <div className="text-sm leading-relaxed">
      <div className="inline-flex items-center justify-center pr-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex  justify-end items-end gap-1">
              {
                activity.user.avatarUrl ? 
                <Avatar className="bg-neutral-600 dark:bg-neutral-300 size-5">
                <AvatarImage
                  src={activity.user.avatarUrl ?? undefined}
                  alt={actor}
                />
                <AvatarFallback>{getInitials(actor)}</AvatarFallback>
              </Avatar>
              :

              <UserDefaultAvatar name={activity.user.displayName ?? "User"} size={18} />
              }
              <Link
                href={`/m/${activity.user.id}`}
                className="font-medium hover:underline text-foreground relative top-1.25 ">
                {actor}
              </Link>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2 p-2">
              {
                activity.user.avatarUrl ? 

              <Avatar className="bg-neutral-600 dark:bg-neutral-300">
                <AvatarImage
                  src={activity.user.avatarUrl ?? undefined}
                  alt={actor}
                />
                <AvatarFallback>{getInitials(actor)}</AvatarFallback>
              </Avatar>
              :
              <UserDefaultAvatar name={activity.user.displayName ?? "User"} size={25} />
              }
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{actor}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {pieces.map((p, i) => {
        if (p.type === "muted") {
          return (
            <span key={i} className="text-muted-foreground">
              {p.value}
            </span>
          );
        }
        if (p.type === "strong") {
          return (
            <span key={i} className="font-medium text-foreground">
              {p.value}
            </span>
          );
        }
        if (p.type === "target") {
          if (p.href) {
            return (
              <Link
                key={i}
                href={p.href}
                className="font-medium text-foreground tabular-nums hover:underline">
                {p.value}
              </Link>
            );
          }
          return (
            <span key={i} className="font-medium tabular-nums">
              {p.value}
            </span>
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </div>
  );
}
