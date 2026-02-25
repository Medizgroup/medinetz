import {
  BookOpenIcon,
  type LucideIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import {
  Timeline,
  TimelineContent,
  TimelineItem,
  TimelineSeparator,
} from "@/components/ui/timeline";

const items: {
  id: number;
  user: string;
  image: string;
  action: ActionType;
  date: Date;
}[] = [
  {
    action: "post",
    date: new Date(Date.now() - 59000), // 59 seconds ago
    id: 1,
    image: "https://api.dicebear.com/9.x/lorelei/svg?seed=Chase",
    user: "Chase",
  },
  {
    action: "reply",
    date: new Date(Date.now() - 180000), // 3 minutes ago
    id: 2,
    image: "https://api.dicebear.com/9.x/lorelei/svg?seed=Katherine",
    user: "Katherine",
  },
  {
    action: "edit",
    date: new Date(Date.now() - 300000), // 5 minutes ago
    id: 3,
    image: "https://api.dicebear.com/9.x/lorelei/svg?seed=Avery",
    user: "Avery",
  },
  {
    action: "create",
    date: new Date(Date.now() - 600000), // 10 minutes ago
    id: 4,
    image: "https://api.dicebear.com/9.x/lorelei/svg?seed=Wyatt",
    user: "Anna",
  },
];

type ActionType = "post" | "reply" | "edit" | "create";

function getActionIcon(action: ActionType): LucideIcon {
  const icons: Record<ActionType, LucideIcon> = {
    create: PlusIcon,
    edit: PencilIcon,
    post: BookOpenIcon,
    reply: MessageCircleIcon,
  };
  return icons[action];
}

function getActionText(action: ActionType): string {
  const texts: Record<ActionType, string> = {
    create: "hat einen neuen Fall erstellt",
    edit: "hat in dem Protokoll kommentiert",
    post: "hat den Protokoll bearbeitet",
    reply: "hat einen neuen User angelegt.",
  };
  return texts[action];
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export default function HomeActivity() {
  return (
    <div className="space-y-3 sm:col-span-3  p-4 sm:p-10">
      <div className="font-medium text-muted-foreground text-sm">
        Aktivitäten
      </div>
      <Timeline>
        {items.map((item) => {
          const ActionIcon = getActionIcon(item.action);
          return (
            <TimelineItem
              className="m-0! flex-row items-center gap-3 py-2.5! "
              key={item.id}
              step={item.id}>
              <ActionIcon className="text-muted-foreground/80" size={16} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={item.user}
                className="size-7 rounded-full"
                src={item.image}
              />
              <TimelineContent className="text-foreground">
                <a className="font-medium hover:underline" href="#">
                  {item.user}
                </a>
                <span className="font-normal">
                  {" "}
                  {getActionText(item.action)}{" "}
                  <a className="hover:underline text-muted-foreground" href="#">
                    {getRelativeTimeString(item.date)}
                  </a>
                </span>
              </TimelineContent>
            </TimelineItem>
          );
        })}
        <span className="text-muted-foreground text-sm pt-4">
          alle ansehen &#8594;
        </span>
      </Timeline>
    </div>
  );
}
