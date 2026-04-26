/* eslint-disable react-hooks/static-components */
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";
import { format, formatDistance } from "date-fns";
import { de } from "date-fns/locale";

import RichTextRenderer from "@/components/protocols/rich-text-renderer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  STATUS_LABEL,
  PRIORITY_LABEL,
  //   SENSITIVITY_LABEL,
  priorityVariant,
  statusColorClass,
  statusIcon,
  //   sensitivityIcon,
  canEditCase,
  canViewCase,
  canComment,
} from "@/lib/utils/cases";
import { detailedIcon } from "@/lib/utils/index";
import EditCaseForm from "@/components/case/edit-case-form";
import CaseStatusControls from "@/components/case/case-status-controls";
import ActivityLine from "@/components/activity/activity-line";
import CaseCommentForm from "@/components/case/case-comment-form";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const c = await prisma.case.findUnique({
    where: { id },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      sensitivityLevel: true,
      patientPseudonym: true,
      patientLanguage: true,
      patientNotes: true,
      totalCosts: true,
      estimatedCosts: true,
      createdAt: true,
      updatedAt: true,
      closedAt: true,
      dueDate: true,
      organizationId: true,
      creatorId: true,
      assigneeId: true,
      organization: { select: { id: true, name: true } },
      creator: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
      assignee: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
      closedByUser: {
        select: { id: true, displayName: true, name: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          contentText: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              displayName: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!c) notFound();

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: c.organizationId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership || !canViewCase(membership.role)) notFound();

  const editable = canEditCase(
    membership.role,
    c.creatorId === session.user.id,
  );

  // Mitglieder für Assignee-Dropdown
  const orgMembers = await prisma.organizationMember.findMany({
    where: { organizationId: c.organizationId, user: { isActive: true } },
    select: {
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ user: { displayName: "asc" } }, { user: { name: "asc" } }],
  });

  const memberOptions = orgMembers.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName || m.user.name || m.user.email,
    email: m.user.email,
  }));

  // Activity feed
  const activities = await prisma.activity.findMany({
    where: {
      organizationId: c.organizationId,
      OR: [
        { targetType: "case", targetId: c.id },
        {
          targetType: "case_comment",
          metadata: { path: ["caseId"], equals: c.id },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      metadata: true,
      user: {
        select: { id: true, displayName: true, name: true },
      },
    },
  });

  const StatusIcon = statusIcon(c.status);
  //   const SensitivityIcon = sensitivityIcon(c.sensitivityLevel);

  const creatorName =
    c.creator.displayName || c.creator.name || c.creator.id.slice(0, 6);

  return (
    <div className="grid w-full grid-cols-4 gap-4">
      <div className="col-span-3 mx-auto w-full max-w-6xl space-y-10 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">
              {c.organization.name}
            </span>
            <h1 className="text-2xl font-semibold">
              #{c.caseNumber} · {c.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Erstellt von {creatorName} ·{" "}
              {format(c.createdAt, "dd. MMM yyyy", { locale: de })}
              {c.closedAt
                ? ` · Geschlossen ${format(c.closedAt, "dd. MMM yyyy", { locale: de })}`
                : ""}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" size="lg" className={`rounded-full`}>
                <StatusIcon
                  className={`size-3.5 ${statusColorClass(c.status)}`}
                />
                {STATUS_LABEL[c.status]}
              </Badge>
              <Badge variant={priorityVariant(c.priority)} size="lg">
                {PRIORITY_LABEL[c.priority]}
              </Badge>

              {/* {c.dueDate ? (
                <Badge variant="secondary">
                  Frist: {format(c.dueDate, "dd.MM.yyyy", { locale: de })}
                </Badge>
              ) : null} */}
            </div>
          </div>

          <Button
            render={<Link href="/cases">Zurück</Link>}
            variant="outline"
            className="rounded-full"
          />
        </div>

        {editable ? (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Bearbeiten</h2>
              <EditCaseForm
                caseData={{
                  id: c.id,
                  title: c.title,
                  description: c.description,
                  patientPseudonym: c.patientPseudonym,
                  patientLanguage: c.patientLanguage,
                  patientNotes: c.patientNotes,
                  priority: c.priority,
                  sensitivityLevel: c.sensitivityLevel,
                  dueDate: c.dueDate
                    ? c.dueDate.toISOString().slice(0, 10)
                    : null,
                  estimatedCosts: c.estimatedCosts
                    ? String(c.estimatedCosts)
                    : null,
                }}
              />
            </section>
            <Separator />
          </>
        ) : (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Beschreibung</h2>
            <div className="rounded-2xl border p-5 whitespace-pre-wrap text-sm">
              {c.description || (
                <span className="text-muted-foreground">
                  Keine Beschreibung.
                </span>
              )}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Kommentare</h2>

          {canComment(membership.role) ? (
            <CaseCommentForm caseId={c.id} organizationId={c.organizationId} />
          ) : null}

          {c.comments.length === 0 ? (
            <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
              Noch keine Kommentare.
            </div>
          ) : (
            <Timeline>
              {c.comments.map((comment, k) => {
                const userName =
                  comment.user.displayName ||
                  comment.user.name ||
                  `User ${comment.user.id.slice(0, 6)}`;

                return (
                  <TimelineItem
                    className="group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-8"
                    key={comment.id}
                    step={k}>
                    <TimelineHeader>
                      <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                      <TimelineTitle className="mt-0.5">
                        {userName}
                      </TimelineTitle>
                      <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-6 items-center justify-center border-none">
                        <Avatar>
                          <AvatarImage
                            alt={userName}
                            className="size-6 rounded-full"
                            src={comment.user.avatarUrl ?? undefined}
                          />
                          <AvatarFallback>
                            {userName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent className="mt-2 rounded-lg border px-4 py-3 text-foreground">
                      <RichTextRenderer value={comment.content} />
                      <TimelineDate className="mt-1 mb-0">
                        vor{" "}
                        {formatDistance(
                          new Date(comment.createdAt),
                          new Date(),
                          {
                            locale: de,
                          },
                        )}
                      </TimelineDate>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Aktivität</h2>
          <Timeline defaultValue={activities.length}>
            {activities.map((a, idx) => {
              const step = activities.length - idx;
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
                  className="group-data-[orientation=vertical]/timeline:ms-10">
                  <TimelineHeader>
                    <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
                    <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-5 items-center justify-center border-none bg-accent">
                      <Icon size={14} className="text-muted-foreground" />
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent>
                    <ActivityLine
                      activity={{
                        action: a.action,
                        targetType: "case",
                        targetId: c.id,
                        metadata: (a.metadata ?? {}) as any,
                        user: a.user,
                      }}
                    />
                    <TimelineDate className="mb-0 mt-1">
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
        </section>
      </div>

      <aside className="mt-24 space-y-6 px-2">
        {editable ? (
          <CaseStatusControls
            caseId={c.id}
            status={c.status}
            assigneeId={c.assigneeId}
            members={memberOptions}
          />
        ) : (
          <div className="space-y-2 text-sm">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Zugewiesen an
            </div>
            <div>
              {c.assignee?.displayName || c.assignee?.name || "— Niemand —"}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Patient
            </div>
            <div className="font-medium tabular-nums">{c.patientPseudonym}</div>
            {c.patientLanguage ? (
              <div className="text-muted-foreground">{c.patientLanguage}</div>
            ) : null}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Geschätzte Kosten
            </div>
            <div className="tabular-nums">
              {c.estimatedCosts
                ? `${Number(c.estimatedCosts).toFixed(2)} €`
                : "—"}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase">
              Bisherige Kosten
            </div>
            <div className="tabular-nums">
              {Number(c.totalCosts).toFixed(2)} €
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
