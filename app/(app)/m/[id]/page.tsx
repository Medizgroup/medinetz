/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import InactiveComponent from "@/app/inactive/inactive-component";
import UserActivityCalendar from "@/components/user/user-activity-calendar";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  // TimelineTitle,
} from "@/components/ui/timeline";
import { detailedIcon } from "@/lib/utils/index";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import ActivityLine from "@/components/activity/activity-line";
import { NotProduct } from "@/components/not-product";
import Image from "next/image";
import HomeCase from "@/components/home/home-cases";

// --- helpers ---
function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildCalendarData(dates: Date[]) {
  const today = new Date();

  // UTC-normalisieren
  today.setUTCHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 365);

  const counts = new Map<string, number>();

  for (const dt of dates) {
    const key = toISODate(dt);

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const allDays: { date: string; count: number }[] = [];

  const cur = new Date(start);

  while (cur <= today) {
    const key = toISODate(cur);

    allDays.push({
      date: key,
      count: counts.get(key) ?? 0,
    });

    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const levelOf = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 4) return 2;
    if (count <= 7) return 3;
    return 4;
  };

  return allDays.map((d) => ({
    ...d,
    level: levelOf(d.count),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  // Optional session: Profil ist öffentlich
  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user?.id === id;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const oneYearAgo = new Date(today);
  oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);
  // User laden (öffentlich sichtbare Felder)
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      isActive: true,
      displayName: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,

      // Calendar: nur createdAt genügt
      activities: {
        where: {
          createdAt: {
            gte: oneYearAgo,
          },
        },
        select: { createdAt: true },
      },
    },
  });

  if (!user) {
    return NotProduct();
  }

  // Inaktiv: Owner darf es sehen, andere nicht
  if (!user.isActive) {
    if (isOwner) {
      return <InactiveComponent />;
    }
    return NotProduct();
  }

  const latestActivities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      metadata: true,
      user: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
    },
  });

  const assignedCases = await prisma.case.findMany({
    where: {
      assigneeId: user.id,
      status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      caseNumber: true,
      status: true,
      priority: true,
      updatedAt: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
    },
  });

  const calendarData = buildCalendarData(
    user.activities.map((a) => a.createdAt),
  );

  const display =
    user.displayName || user.name || `User ${user.id.slice(0, 6)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="size-44 overflow-hidden rounded-full">
            {user.avatarUrl ? (
              <Image
                width={176}
                height={176}
                src={user.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold leading-tight">{display}</h1>
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              Mitglied seit {user.createdAt.toLocaleDateString("de-DE")}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full">
              <Link href="/settings/profile">Profil bearbeiten</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Activity Calendar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Aktivitäten</h2>

          {/* “Mehr anzeigen” kann öffentlich sein */}
          <Button
            variant="outline"
            size="xs"
            className="rounded-full"
            render={<Link href="/activities" />}>
            Mehr anzeigen
          </Button>
        </div>

        <div className="rounded-2xl border p-4">
          <UserActivityCalendar data={calendarData} />
        </div>
      </section>

      {/* Assigned cases */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4 py-4">
          <h2 className="text-lg font-semibold">Zugewiesene Cases</h2>
        </div>

        <HomeCase cases={assignedCases} />
        {/* <div className="gap-4 flex flex-col">
          {assignedCases.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Empty className="py-4">
                <EmptyHeader>
                  <EmptyMedia>
                    <SearchCardsIllustration />
                  </EmptyMedia>
                  <EmptyTitle>Keine offenen Cases zugewiesen</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            assignedCases.map((c) => {
              const Icon = statusIcon(c.status);
              return (
                <Alert key={c.id} variant={priorityVariant(c.priority)}>
                  <Icon size={16} />
                  <AlertTitle>{c.title}</AlertTitle>
                  <AlertDescription className="flex items-center flex-row gap-2">
                    In {c.organization.name}
                    <Badge
                      variant={
                        c.priority === "HIGH"
                          ? "error"
                          : c.priority === "LOW"
                            ? "warning"
                            : c.priority === "MEDIUM"
                              ? "info"
                              : "success"
                      }
                      className="capitalize!">
                      {c.priority}
                    </Badge>
                  </AlertDescription>
                  <span className="px-6 text-xs text-muted-foreground flex ">
                    {c.updatedAt.toLocaleDateString("de-DE")}
                  </span>
                </Alert>
              );
            })
          )}
        </div> */}
      </section>

      {/* Latest Activity List */}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Letzte Aktivitäten</h2>

        <div className="p-4">
          {latestActivities.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Noch keine Aktivitäten.
            </div>
          ) : (
            <Timeline defaultValue={latestActivities.length}>
              {latestActivities.map((a, idx) => {
                const step = latestActivities.length - idx;
                const Icon = detailedIcon({
                  action: a.action,
                  targetType: a.targetType,
                  targetId: a.targetId,
                  metadata: (a.metadata ?? {}) as any,
                  user: a.user,
                });

                return (
                  <TimelineItem
                    key={a.id}
                    step={step}
                    className="group-data-[orientation=vertical]/timeline:ms-10 ">
                    <TimelineHeader>
                      <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />

                      {/* <TimelineTitle className="mt-0.5">{title}</TimelineTitle> */}

                      <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-5 items-center justify-center border-none bg-primary/10 group-data-completed/timeline-item:bg-primary/10 group-data-completed/timeline-item:text-foreground ">
                        <Icon size={12} />
                      </TimelineIndicator>
                    </TimelineHeader>

                    <TimelineContent>
                      <ActivityLine
                        activity={{
                          action: a.action,
                          targetType: a.targetType,
                          targetId: a.targetId,
                          metadata: (a.metadata ?? {}) as any,
                          user: a.user,
                        }}
                      />

                      <TimelineDate className="mt-2 mb-0">
                        {formatDistance(new Date(a.createdAt), new Date(), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </TimelineDate>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </div>
      </section>
    </div>
  );
}
