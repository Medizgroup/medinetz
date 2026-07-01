import { CalendarMark, Dialog, MentionCircle, RecordAudioCircle, Refresh, SquareTopUp, UserPlusRounded } from "@solar-icons/react-perf/category/style/LineDuotone";
import {
  type LucideIcon,
} from "lucide-react";

export function notificationIcon(type: string): LucideIcon {
  switch (type) {
    case "MENTION":
      return MentionCircle;
    case "ASSIGNMENT":
      return UserPlusRounded;
    case "COMMENT":
      return Dialog;
    case "CASE_UPDATE":
      return Refresh;
    case "PROTOCOL_UPDATE":
      return SquareTopUp;
    case "EVENT_INVITE":
      return CalendarMark;
    default:
      return RecordAudioCircle;
  }
}
