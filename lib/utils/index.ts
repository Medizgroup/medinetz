export {
  actionMeta,
  describeActivity,
  actorName,
  targetTypeLabel,
  targetAnchor,
  detailedIcon,
} from "./activities";
export type { ActivityForDisplay, DescriptionPiece } from "./activities";

// Legacy-Wrapper für bestehenden Code, der `activityDescription` als String erwartet.
import { describeActivity as _describe } from "./activities";
import type { ActivityForDisplay } from "./activities";

export function activityDescription(a: ActivityForDisplay): string {
  return _describe(a)
    .map((p) => p.value)
    .join("");
}

export function targetLabel(targetType: string) {
  switch (targetType) {
    case "case":
      return "Fall";
    case "protocol":
      return "Protokoll";
    case "case_comment":
    case "protocol_comment":
      return "Kommentar";
    case "attachment":
      return "Anhang";
    case "expense":
      return "Ausgabe";
    default:
      return "Eintrag";
  }
}

export function orgTypeLabel(orgType?: string | null) {
  if (!orgType) return null;
  switch (orgType) {
    case "ROUTINE":
      return "Routine";
    case "PREGNANCY":
      return "Schwangerschaft";
    case "MANAGEMENT":
      return "Management";
    case "CUSTOM":
      return "Projekt";
    default:
      return orgType;
  }
}
