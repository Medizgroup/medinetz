import {
  Circle,
  CircleCheck,
  Clock,
  Loader,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";
import type { CasePriority, CaseStatus } from "@/generated/prisma/client";
import { OrgOption } from "@/components/protocols/protocols-table";

export const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: "Offen",
  IN_PROGRESS: "In Bearbeitung",
  WAITING: "Wartend",
  CLOSED: "Abgeschlossen",
};

export const PRIORITY_LABEL: Record<CasePriority, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

export const SENSITIVITY_LABEL: Record<number, string> = {
  1: "Standard",
  2: "Erhöht",
  3: "Sehr hoch",
};

export function statusIcon(status: CaseStatus) {
  switch (status) {
    case "OPEN":
      return Circle;
    case "IN_PROGRESS":
      return Loader;
    case "WAITING":
      return Clock;
    case "CLOSED":
      return CircleCheck;
  }
}

export function statusColorClass(status: CaseStatus) {
  switch (status) {
    case "OPEN":
      return "text-green-500";
    case "IN_PROGRESS":
      return "text-amber-500";
    case "WAITING":
      return "text-muted-foreground/40";
    case "CLOSED":
      return "text-blue-500";
  }
}

export function priorityVariant(
  priority: CasePriority,
): "secondary" | "info" | "warning" | "error" | "destructive" {
  switch (priority) {
    case "LOW":
      return "info";
    case "MEDIUM":
      return "warning";
    case "HIGH":
      return "error";
    case "URGENT":
      return "destructive";
  }
}

export function sensitivityIcon(level: number) {
  if (level >= 3) return ShieldAlert;
  if (level === 2) return ShieldCheck;
  return Shield;
}

export function canCreateCase(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}

export function canEditCase(role?: string, isCreator?: boolean) {
  if (role === "COORDINATOR" || role === "ADMIN") return true;
  return Boolean(isCreator);
}

export function canViewCase(role?: string) {
  return role === "VIEWER" || role === "COORDINATOR" || role === "ADMIN";
}

export function orgTypeBadge(type: OrgOption["type"]) {
  switch (type) {
    case "ROUTINE":
      return {
        label: "R",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      };
    case "PREGNANCY":
      return {
        label: "S",
        className: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      };
    case "MANAGEMENT":
      return {
        label: "M",
        className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      };
    case "CUSTOM":
      return {
        label: "C",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
}

export function canComment(role?: string) {
  return role === "VIEWER" || role === "COORDINATOR" || role === "ADMIN";
}
