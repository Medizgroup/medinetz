"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";
import { CasePriority, CaseStatus } from "@/generated/prisma/enums";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { PRIORITY_LABEL, priorityVariant, statusIcon } from "@/lib/utils/cases";

type Props = {
  cases: {
    id: string;
    title: string;
    status: CaseStatus;
    priority: CasePriority;
    caseNumber: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export default function HomeCase({ cases }: Props) {
  return (
    <div className="w-full space-y-3">
      <div className="text-sm font-medium text-muted-foreground dark:text-foreground/80">
        Wo du deine Aufmerksamkeit schenken solltest
      </div>

      {cases.length === 0 ? (
        <div className="flex items-center justify-center p-4">
          <Empty className="py-2">
            <EmptyHeader>
              <EmptyMedia>
                <NodesIllustration />
              </EmptyMedia>
              <EmptyTitle>Du hast Keine offenen Fälle</EmptyTitle>
              <EmptyDescription>
                Wenn du einen Fall erstellst, wird er hier angezeigt.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex gap-2">
                <Button
                  className="rounded-xl"
                  render={<Link href="/cases/new" />}>
                  Neuer Fall
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        cases.map((c) => (
          <Alert
            key={c.id}
            variant={
              c.status === "OPEN"
                ? "success"
                : c.status === "IN_PROGRESS"
                  ? "warning"
                  : c.status === "CLOSED"
                    ? "info"
                    : "default"
            }>
            {(() => {
              const Icon = statusIcon(c.status);
              return <Icon />;
            })()}

            <AlertTitle>Fall #{c.caseNumber}</AlertTitle>
            <AlertDescription className="flex-row items-center gap-2">
              {c.title}

              <Badge
                className="inline-flex items-center gap-1"
                variant={priorityVariant(c.priority as CasePriority)}>
                {PRIORITY_LABEL[c.priority]}
              </Badge>
            </AlertDescription>
            <AlertAction>
              <Button size="xs">
                <Link href={`/cases/${c.id}`}>Ansehen</Link>
              </Button>
            </AlertAction>
          </Alert>
        ))
      )}

      <Link
        href="/cases"
        className="text-sm text-muted-foreground hover:text-primary/90">
        Alle Fälle ansehen &#8594;
      </Link>
    </div>
  );
}

function NodesIllustration() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
      {/* Connection lines */}
      <line
        x1="100"
        y1="60"
        x2="44"
        y2="30"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="44"
        y2="90"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="156"
        y2="30"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="60"
        x2="156"
        y2="90"
        className="stroke-border"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      {/* Center node */}
      <circle
        cx="100"
        cy="60"
        r="18"
        className="fill-primary/10 dark:fill-primary/15 stroke-primary/40"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="60" r="6" className="fill-primary/30" />
      <circle cx="100" cy="60" r="2.5" className="fill-primary" />
      {/* Top-left node */}
      <circle
        cx="44"
        cy="30"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="37"
        y="26"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="40"
        y="32"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Bottom-left node */}
      <circle
        cx="44"
        cy="90"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="37"
        y="86"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="40"
        y="92"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Top-right node */}
      <circle
        cx="156"
        cy="30"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="149"
        y="26"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="152"
        y="32"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Bottom-right node */}
      <circle
        cx="156"
        cy="90"
        r="14"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="149"
        y="86"
        width="14"
        height="3"
        rx="1.5"
        className="fill-muted-foreground/20"
      />
      <rect
        x="152"
        y="92"
        width="8"
        height="2"
        rx="1"
        className="fill-muted-foreground/12"
      />
      {/* Small floating dots */}
      <circle cx="72" cy="40" r="2" className="fill-primary/15" />
      <circle cx="128" cy="80" r="2" className="fill-primary/15" />
      <circle cx="72" cy="80" r="1.5" className="fill-muted-foreground/10" />
      <circle cx="128" cy="40" r="1.5" className="fill-muted-foreground/10" />
    </svg>
  );
}
