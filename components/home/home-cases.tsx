"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Empty,
  EmptyContent,
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
import {
  NodesIllustration,
  SearchCardsIllustration,
} from "@/lib/utils/Illustration";
import { usePathname } from "next/navigation";

type Props = {
  cases: {
    id: string;
    title: string;
    status: CaseStatus;
    priority: CasePriority;
    caseNumber: number;
    createdAt: Date;
    updatedAt: Date;
    organization: {
      id: string;
      name: string;
    } | null;
  }[];
};

export default function HomeCase({ cases }: Props) {
  const pathname = usePathname();
  const isHomePage = pathname === "/home";
  return (
    <div className="w-full space-y-3">
      {isHomePage ? (
        <div className="text-sm font-medium text-muted-foreground dark:text-foreground/80">
          Wo du deine Aufmerksamkeit schenken solltest
        </div>
      ) : null}

      {cases.length === 0 ? (
        <div className="flex items-center justify-center p-4">
          <Empty className="py-2">
            <EmptyHeader>
              <EmptyMedia>
                {isHomePage ? (
                  <NodesIllustration />
                ) : (
                  <SearchCardsIllustration />
                )}
              </EmptyMedia>
              <EmptyTitle>Keine offenen Cases zugewiesen</EmptyTitle>
            </EmptyHeader>
            {isHomePage ? (
              <EmptyContent>
                <div className="flex gap-2">
                  <Button size="xs" render={<Link href="/cases/new" />}>
                    Neuer Fall &#8594;
                  </Button>
                </div>
              </EmptyContent>
            ) : null}
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

      {cases.length > 5 ? (
        <Link
          href="/cases"
          className="text-sm text-muted-foreground hover:text-primary/90 pt-4">
          Alle Fälle ansehen &#8594;
        </Link>
      ) : null}
    </div>
  );
}
