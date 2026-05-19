"use client";

import * as React from "react";
import Link from "next/link";
import { X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  markOnboardingStepAction,
  dismissOnboardingAction,
} from "@/app/(app)/actions/onboarding";
import type { OnboardingStepKey } from "@/lib/types/onboarding";
import {
  ArrowRightUp,
  CheckCircle,
  DocumentAdd,
  FolderOpen,
  Tuning2,
  UsersGroupTwoRounded,
  UserSpeak,
} from "@solar-icons/react-perf/category/style/LineDuotone";

type StepDef = {
  key: OnboardingStepKey;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  href: string;
};

type Props = {
  isAdmin: boolean;
  steps: { key: OnboardingStepKey; isCompleted: boolean }[];
  completedCount: number;
  totalCount: number;
};

function getStepDefs(isAdmin: boolean): StepDef[] {
  return [
    {
      key: "profile",
      title: "Profil vervollständigen",
      description:
        "Lade ein Avatar hoch und ergänze deinen Namen, damit Kolleg:innen dich erkennen.",
      icon: UserSpeak,
      actionLabel: "Zum Profil",
      href: "/settings/profile",
    },
    {
      key: "preferences",
      title: "Basis-Einstellungen setzen",
      description:
        "Sprache, Zeitzone und Benachrichtigungen an deine Bedürfnisse anpassen.",
      icon: Tuning2,
      actionLabel: "Einstellungen öffnen",
      href: "/settings/account",
    },
    isAdmin
      ? {
          key: "organization",
          title: "Team einladen",
          description:
            "Lade Kolleg:innen ein, damit ihr Fälle und Protokolle gemeinsam bearbeiten könnt.",
          icon: UsersGroupTwoRounded,
          actionLabel: "Mitglieder einladen",
          href: "/dashboard/users",
        }
      : {
          key: "organization",
          title: "Organisation beitreten",
          description:
            "Tritt einer Organisation bei, um Zugriff auf deren Fälle und Protokolle zu erhalten.",
          icon: UsersGroupTwoRounded,
          actionLabel: "Zu Organisationen",
          href: "/settings/organizations",
        },
    {
      key: "firstCase",
      title: "Ersten Fall anlegen",
      description:
        "Erfasse einen Fall mit Patient:in, Diagnose und benötigten Ressourcen. und bearbeite Sie danach gemeinsam mit deinem Team.",
      icon: FolderOpen,
      actionLabel: "Fall erstellen",
      href: "/cases/new",
    },
    {
      key: "firstProtocol",
      title: "Erstes Protokoll erstellen",
      description:
        "Halte Sitzungen und Entscheidungen strukturiert für dein Team fest.",
      icon: DocumentAdd,
      actionLabel: "Protokoll erstellen",
      href: "/protocols/new",
    },
  ];
}

function iconColor(isCompleted: boolean, isActive: boolean) {
  if (isCompleted) return "text-muted-foreground/30";
  if (isActive) return "text-primary";
  return "text-muted-foreground/40";
}

function titleClass(isCompleted: boolean, isActive: boolean) {
  if (isCompleted) return "text-muted-foreground/50 line-through";
  if (isActive) return "text-foreground";
  return "text-muted-foreground";
}

function StepIndicator({
  index,
  isCompleted,
  isActive,
}: {
  index: number;
  isCompleted: boolean;
  isActive: boolean;
}) {
  if (isCompleted) {
    return (
      <div className="flex size-7 items-center justify-center">
        <CheckCircle aria-hidden="true" className="size-7 text-emerald-500" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}>
      {index + 1}
    </div>
  );
}

export default function HomeOnboarding({
  isAdmin,
  steps,
  completedCount,
  totalCount,
}: Props) {
  const [pending, startTransition] = React.useTransition();
  const defs = getStepDefs(isAdmin);

  const merged = defs.map((def) => ({
    def,
    isCompleted: steps.find((s) => s.key === def.key)?.isCompleted ?? false,
  }));

  const activeIndex = merged.findIndex((m) => !m.isCompleted);
  const allDone = completedCount === totalCount;

  function handleMark(key: OnboardingStepKey) {
    startTransition(async () => {
      await markOnboardingStepAction(key);
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissOnboardingAction();
    });
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Willkommen — richte deinen Arbeitsbereich ein
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Erledige diese Schritte, um schnell mit Routine produktiv zu werden.
          </p>
        </div>
        <Button
          aria-label="Onboarding ausblenden"
          disabled={pending}
          onClick={handleDismiss}
          size="icon"
          variant="ghost">
          <X className="size-4" />
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {allDone ? (
              <span className="font-medium text-emerald-600">
                Alles erledigt
              </span>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {completedCount}
                </span>{" "}
                von {totalCount} erledigt
              </>
            )}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {merged.map(({ def, isCompleted }, index) => {
          const isActive = index === activeIndex;
          const Icon = def.icon;

          return (
            <div
              className={cn(
                "rounded-lg border p-4 transition-colors",
                isActive
                  ? "border-primary/30 bg-muted/50"
                  : "border-border bg-background",
              )}
              key={def.key}>
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <StepIndicator
                    index={index}
                    isActive={isActive}
                    isCompleted={isCompleted}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium leading-6",
                          titleClass(isCompleted, isActive),
                        )}>
                        {def.title}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm leading-5",
                          isActive
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60",
                        )}>
                        {def.description}
                      </p>
                      {isActive && !isCompleted ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
                          <Button
                            size="sm"
                            variant="ghost"
                            render={<Link href={def.href} />}>
                            <Icon
                              aria-hidden="true"
                              className="-ml-0.5 size-4 shrink-0"
                            />
                            {def.actionLabel}
                            <ArrowRightUp
                              aria-hidden="true"
                              className="size-3.5 "
                            />
                          </Button>
                          <Button
                            disabled={pending}
                            className="bg-accent hover:bg-accent/50! rounded-full"
                            onClick={() => handleMark(def.key)}
                            size="xs"
                            variant="ghost">
                            Überspringen
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        iconColor(isCompleted, isActive),
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
