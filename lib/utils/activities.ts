import {
  Paperclip,
  Flag,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

import type { ActivityAction } from "@/generated/prisma/client";

import {
  STATUS_LABEL,
  PRIORITY_LABEL,
  SENSITIVITY_LABEL,
} from "@/lib/utils/cases";
import { CalendarAdd, CheckCircle, Dialog, MentionCircle, PenNewSquare, Refresh, RestartCircle, UserPlusRounded, WidgetAdd } from "@solar-icons/react-perf/category/style/LineDuotone";

// ========== Typen ==========

type ActivityMetadata = {
  // CASE
  title?: string;
  caseNumber?: number;
  // ASSIGNED
  from?: string | null;
  to?: string | null;
  fromUserName?: string | null;
  toUserName?: string | null;
  // UPDATED status
  field?: string;
  fields?: string[];
  // PROTOCOL
  protocolId?: string;
  protocolTitle?: string;
  mentionedUserIds?: string[];
  caseIds?: string[];
};

export type ActivityForDisplay = {
  action: ActivityAction;
  targetType: string;
  targetId: string;
  metadata: ActivityMetadata | null;
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
};

// ========== Helpers ==========

export function actorName(user: ActivityForDisplay["user"]) {
  return user.displayName || user.name || `User ${user.id.slice(0, 6)}`;
}

export function targetTypeLabel(targetType: string) {
  switch (targetType) {
    case "case":
      return "Fall";
    case "protocol":
      return "Protokoll";
    case "case_comment":
      return "Kommentar";
    case "protocol_comment":
      return "Kommentar";
    case "attachment":
      return "Anhang";
    default:
      return "Eintrag";
  }
}

/**
 * Kurzer Anker für ein Target — z.B. "#4" für Cases/Protokolle.
 * Nutzt metadata.caseNumber wenn vorhanden, sonst targetId-Kurzform.
 */
export function targetAnchor(activity: ActivityForDisplay) {
  const meta = activity.metadata ?? {};
  if (meta.caseNumber) return `#${meta.caseNumber}`;
  return null;
}

// ========== Icon + Kurz-Label (für kompakte Listen) ==========

export function actionMeta(action: ActivityAction): {
  Icon: LucideIcon;
  shortLabel: string;
} {
  switch (action) {
    case "CREATED":
      return { Icon: WidgetAdd, shortLabel: "Erstellen" };
    case "UPDATED":
      return { Icon: Refresh, shortLabel: "aktualisiert" };
    case "COMMENTED":
      return { Icon: Dialog, shortLabel: "Kommentar" };
    case "ASSIGNED":
      return { Icon: UserPlusRounded, shortLabel: "Zuweisung" };
    case "CLOSED":
      return { Icon: CheckCircle, shortLabel: "Aktion" };
    case "REOPENED":
      return { Icon: RestartCircle, shortLabel: "wieder geöffnet" };
    case "MENTIONED":
      return { Icon: MentionCircle, shortLabel: "erwähnt" };
    case "ATTACHED":
      return { Icon: Paperclip, shortLabel: "Anhang hinzugefügt" };
    default:
      return { Icon: PenNewSquare, shortLabel: "Aktivität" };
  }
}

/**
 * Spezifisches Icon, das pro Action+Metadata nuancierter ist.
 * Z.B. UPDATED + field=priority → Flag-Icon.
 */
export function detailedIcon(activity: ActivityForDisplay): LucideIcon {
  const { action, metadata } = activity;
  const field = metadata?.field;

  if (action === "UPDATED" && field) {
    if (field === "priority") return Flag;
    if (field === "dueDate") return CalendarAdd;
    if (field === "sensitivityLevel") return ShieldAlert;
    if (field === "status") return Refresh;
  }

  return actionMeta(action).Icon;
}

// ========== Volle Beschreibung als Pieces ==========

/**
 * Liefert eine Liste von "Pieces", die die Page als Span-Mix rendert.
 * Damit kannst du z.B. den Akteur fett, das Target verlinkt, etc.
 */
export type DescriptionPiece =
  | { type: "text"; value: string }
  | { type: "muted"; value: string }
  | { type: "strong"; value: string }
  | { type: "target"; value: string; href?: string };

export function describeActivity(
  activity: ActivityForDisplay,
): DescriptionPiece[] {
  const { action, targetType, targetId, metadata } = activity;
  const meta = metadata ?? {};
  const anchor = targetAnchor(activity);

  // Target-Bezeichnung: "#4" oder "Fall" oder "diesen Eintrag"
  const targetPiece: DescriptionPiece = anchor
    ? {
        type: "target",
        value: anchor,
        href: targetHref(targetType, targetId, meta),
      }
    : { type: "text", value: targetTypeLabel(targetType) };

  switch (action) {
    case "CREATED":
      return [
        { type: "text", value: `hat einen ${targetTypeLabel(targetType)} ` },
        targetPiece,
        ...(meta.title
          ? ([
              { type: "muted", value: " · " },
              { type: "text", value: `„${meta.title}"` },
            ] as DescriptionPiece[])
          : []),
        { type: "text", value: " erstellt" },
      ];

    case "ASSIGNED": {
      const toName = meta.toUserName ?? null;
      const fromName = meta.fromUserName ?? null;

      if (!meta.to) {
        // Zuweisung entfernt
        return [
          { type: "text", value: "hat die Zuweisung von " },
          targetPiece,
          { type: "text", value: " entfernt" },
          ...(fromName
            ? ([
                { type: "muted", value: " (war: " },
                { type: "strong", value: fromName },
                { type: "muted", value: ")" },
              ] as DescriptionPiece[])
            : []),
        ];
      }

      const base: DescriptionPiece[] = [
        { type: "text", value: "hat den " },
        targetPiece,
        { type: "text", value: " an " },
        { type: "strong", value: toName ?? "—" },
        { type: "text", value: " zugewiesen" },
      ];

      if (fromName && fromName !== toName) {
        base.push(
          { type: "muted", value: " (vorher: " },
          { type: "strong", value: fromName },
          { type: "muted", value: ")" },
        );
      }

      return base;
    }

    case "CLOSED":
      return [
        { type: "text", value: "hat den " },
        targetPiece,
        { type: "text", value: " abgeschlossen" },
      ];

    case "REOPENED":
      return [
        { type: "text", value: "hat den " },
        targetPiece,
        { type: "text", value: " wieder geöffnet" },
      ];

    case "COMMENTED": {
      const pieces: DescriptionPiece[] = [
        { type: "text", value: "hat einen " },
        targetPiece,
        { type: "text", value: " hinterlassen." },
      ];
      return pieces;
    }

    case "UPDATED": {
      const field = meta.field;

      // Status-Wechsel
      if (field === "status" && meta.from && meta.to) {
        return [
          { type: "text", value: "hat den" },
          targetPiece,
          { type: "text", value: " auf " },
          {
            type: "strong",
            value:
              STATUS_LABEL[meta.to as keyof typeof STATUS_LABEL] ?? meta.to,
          },
          { type: "text", value: " gesetzt" },
          { type: "muted", value: " (war: " },
          {
            type: "strong",
            value:
              STATUS_LABEL[meta.from as keyof typeof STATUS_LABEL] ?? meta.from,
          },
          { type: "muted", value: ")" },
        ];
      }

      if (field === "priority" && meta.to) {
        return [
          { type: "text", value: "hat die Priorität von " },
          targetPiece,
          { type: "text", value: " auf " },
          {
            type: "strong",
            value:
              PRIORITY_LABEL[meta.to as keyof typeof PRIORITY_LABEL] ?? meta.to,
          },
          { type: "text", value: " gesetzt" },
        ];
      }

      if (field === "sensitivityLevel" && meta.to !== undefined) {
        const level = Number(meta.to);
        return [
          { type: "text", value: "hat die Sensibilität von " },
          targetPiece,
          { type: "text", value: " auf " },
          { type: "strong", value: `Stufe ${level}` },
          ...(SENSITIVITY_LABEL[level]
            ? ([
                { type: "muted", value: ` · ${SENSITIVITY_LABEL[level]}` },
              ] as DescriptionPiece[])
            : []),
          { type: "text", value: " gesetzt" },
        ];
      }

      if (field === "dueDate") {
        return [
          { type: "text", value: "hat die Frist von " },
          targetPiece,
          { type: "text", value: meta.to ? " geändert" : " entfernt" },
        ];
      }

      // Mehrere Felder
      if (Array.isArray(meta.fields) && meta.fields.length > 0) {
        const labels = meta.fields.map(fieldLabel).filter(Boolean) as string[];
        if (labels.length > 0) {
          return [
            { type: "text", value: "hat die Metadaten von " },
            targetPiece,
            { type: "text", value: " geändert" },
          ];
        }
      }

      return [
        { type: "text", value: "hat einen " },
        targetPiece,
        { type: "text", value: " bearbeitet" },
      ];
    }

    case "MENTIONED":
      return [
        { type: "text", value: "wurde in " },
        targetPiece,
        { type: "text", value: " erwähnt" },
      ];

    case "ATTACHED":
      return [
        { type: "text", value: "hat einen Anhang zu " },
        targetPiece,
        { type: "text", value: " hinzugefügt" },
      ];

    default:
      return [{ type: "text", value: "hat eine Aktivität ausgeführt" }];
  }
}

// ========== Internals ==========

function targetHref(
  targetType: string,
  targetId: string,
  meta: ActivityMetadata,
): string | undefined {
  switch (targetType) {
    case "case":
      return `/cases/${targetId}`;
    case "protocol":
      return `/protocols/${targetId}`;
    case "case_comment":
      // In Zukunft kann man auf #comment-id ankern, fürs Erste auf den Case
      return undefined;
    case "protocol_comment":
      return meta.protocolId ? `/protocols/${meta.protocolId}` : undefined;
    default:
      return undefined;
  }
}

function fieldLabel(field: string): string | null {
  switch (field) {
    case "title":
      return "Titel";
    case "description":
      return "Beschreibung";
    case "priority":
      return "Priorität";
    case "status":
      return "Status";
    case "dueDate":
      return "Frist";
    case "patientPseudonym":
      return "Pseudonym";
    case "patientLanguage":
      return "Sprache";
    case "patientNotes":
      return "Patient-Notizen";
    case "sensitivityLevel":
      return "Sensibilität";
    case "estimatedCosts":
      return "Geschätzte Kosten";
    case "assigneeId":
      return "Zuweisung";
    default:
      return null;
  }
}
