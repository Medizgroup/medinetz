import Link from "next/link";

import { describeActivity, actorName } from "@/lib/utils/activities";
import type { ActivityForDisplay } from "@/lib/utils/activities";

export default function ActivityLine({
  activity,
}: {
  activity: ActivityForDisplay;
}) {
  const pieces = describeActivity(activity);
  const actor = actorName(activity.user);

  return (
    <div className="text-sm leading-relaxed">
      <Link
        href={`/m/${activity.user.id}`}
        className="font-medium hover:underline text-foreground">
        {actor}
      </Link>{" "}
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
