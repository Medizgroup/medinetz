import { ActivityAction } from "@/generated/prisma/enums";

import {
  RotateCcw,
  AtSign,
  Paperclip,
  PlusCircle,
  type LucideIcon,
  RefreshCcw,
  Send,
  CircleCheck,
} from "lucide-react";

export function actionMeta(action: ActivityAction): {
  title: string;
  Icon: LucideIcon;
} {
  switch (action) {
    case "CREATED":
      return {
        title: "Hat einen neuen Eintrag erstellt",
        Icon: PlusCircle,
      };
    case "UPDATED":
      return {
        title: "Hat einen bestehenden Eintrag aktualisiert",
        Icon: RefreshCcw,
      };
    case "COMMENTED":
      return {
        title: "Hat einen Kommentar hinterlassen",
        Icon: Send,
      };
    case "ASSIGNED":
      return {
        title: "Ihm wurde ein neuer Fall zugewiesen",
        Icon: AtSign,
      };
    case "CLOSED":
      return {
        title: "Hat einen Vorgang abgeschlossen",
        Icon: CircleCheck,
      };
    case "REOPENED":
      return {
        title: "Hat einen Vorgang wieder geöffnet",
        Icon: RotateCcw,
      };
    case "MENTIONED":
      return {
        title: "Ihm wurde in einem Beitrag erwähnt",
        Icon: AtSign,
      };
    case "ATTACHED":
      return {
        title: "Hat eine Datei als Anhang hinzugefügt",
        Icon: Paperclip,
      };
    default:
      return {
        title: "Hat eine Aktivität ausgeführt",
        Icon: PlusCircle,
      };
  }
}

export function targetLabel(targetType: string) {
  // Du kannst das später erweitern, wenn du mehr targetTypes hast.
  const t = targetType.toLowerCase();

  if (t.includes("case")) return "Fall";
  if (t.includes("protocol")) return "Protokoll";
  if (t.includes("comment")) return "Kommentar";
  if (t.includes("attachment")) return "Anhang";
  if (t.includes("expense")) return "Ausgabe";
  return "Eintrag";
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

export function activityDescription(a: {
  action: ActivityAction;
  targetType: string;
  organization?: { name: string; type?: string | null } | null;
}) {
  const target = targetLabel(a.targetType);
  const orgName = a.organization?.name;
  const orgType = orgTypeLabel(a.organization?.type ?? null);

  // Beispieltext: “Erstellt · Fall · Routine · OrgaName”
  const parts = [target, orgType, orgName].filter(Boolean);
  return parts.join(" · ");
}
