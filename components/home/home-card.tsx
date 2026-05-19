// components/home/home-card.tsx
"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import HomeTodo from "./home-todos";
import { Case, CasePriority, CaseStatus } from "@/generated/prisma/client";
import HomeCase from "./home-cases";
import { Checklist, FolderOpen, WidgetAdd } from "@/lib/icons";
import HomeOnboarding from "./home-onboarding";
import { OnboardingStatus } from "@/lib/utils/onboarding";

type Props = {
  userId: string;
  stats: {
    todosOpen: number;
    casesAssignedOpen: number;
    casesCreated: number;
  };
  todos: {
    id: string;
    title: string;
    done: boolean;
    dueDate: Date | null;
    priority: number;
    createdAt: Date;
    description: string | null;
  }[];
  cases: Case[];
  onboarding: OnboardingStatus;
};

export default function HomeCard({ onboarding, stats, todos, cases }: Props) {
  const data = [
    {
      name: "Todos",
      value: String(stats.todosOpen).padStart(2, "0"),
      icon: Checklist,
      href: "/todos",
    },
    {
      name: "Fälle",
      value: String(stats.casesAssignedOpen).padStart(2, "0"),
      icon: FolderOpen,
      href: "/cases",
    },
    {
      name: "Erstellt",
      value: String(stats.casesCreated).padStart(2, "0"),
      icon: WidgetAdd,
      href: "/cases",
    },
  ];

  return (
    <div className="flex justify-center p-4  w-full sm:col-span-6 flex-col gap-8 items-start">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {data.map((item) => (
          <Card key={item.name} className="p-0 gap-0">
            <CardContent className="p-6">
              <dd className="flex items-start justify-between space-x-2">
                <span className="truncate text-muted-foreground">
                  {item.name}
                </span>
                <span className="flex items-center justify-center rounded-full bg-sidebar p-2">
                  <item.icon className={cn("size-7 text-foreground")} />
                </span>
              </dd>
              <dd className="tabular-nums mt-1 text-3xl font-semibold text-foreground">
                {item.value}
              </dd>
            </CardContent>

            <CardFooter className="flex justify-end border-t border-border p-0!">
              <a
                href={item.href}
                className="px-6 py-3 text-sm font-medium text-muted-foreground hover:text-primary/90">
                Alles ansehen &#8594;
              </a>
            </CardFooter>
          </Card>
        ))}
      </dl>

      {!onboarding.dismissed && !onboarding.allDone ? (
        <div className="">
          <HomeOnboarding
            completedCount={onboarding.completedCount}
            isAdmin={onboarding.isAdmin}
            steps={onboarding.steps}
            totalCount={onboarding.totalCount}
          />
        </div>
      ) : null}
      <HomeTodo todos={todos} />
      <HomeCase
        cases={
          cases as unknown as {
            id: string;
            title: string;
            status: CaseStatus;
            priority: CasePriority;
            caseNumber: number;
            createdAt: Date;
            updatedAt: Date;
            organization: { id: string; name: string } | null;
          }[]
        }
      />
    </div>
  );
}
