import {
  AtSign,
  CalendarCheck,
  CircleDot,
  MessageSquare,
  RefreshCcw,
  SmilePlus,
  type LucideIcon,
} from "lucide-react";

export function notificationIcon(type: string): LucideIcon {
  switch (type) {
    case "MENTION":
      return AtSign;
    case "ASSIGNMENT":
      return SmilePlus;
    case "COMMENT":
      return MessageSquare;
    case "CASE_UPDATE":
      return RefreshCcw;
    case "PROTOCOL_UPDATE":
      return RefreshCcw;
    case "EVENT_INVITE":
      return CalendarCheck;
    default:
      return CircleDot;
  }
}
