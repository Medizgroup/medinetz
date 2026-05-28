/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import RichTextRenderer from "@/components/protocols/rich-text-renderer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { TElement } from "platejs";
import ProtocolCommentForm from "@/components/protocols/protocol-comment-form";
import EditProtocolForm from "@/components/protocols/edit-protocol-form";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Circle, CircleCheck, Clock, Loader } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { actionMeta, detailedIcon } from "@/lib/utils/index";
import { getInitials } from "@/lib/helper/user";
import ActivityLine from "@/components/activity/activity-line";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { NotProduct } from "@/components/not-product";
import {
  orgTypeBadge,
  PRIORITY_LABEL,
  priorityVariant,
  STATUS_LABEL,
} from "@/lib/utils/cases";
import { cn } from "@/lib/utils";
import { Like } from "@solar-icons/react-perf/category/style/LineDuotone";

// function canEdit(role?: string) {
//   return role === "COORDINATOR" || role === "ADMIN";
// }

function canComment(role?: string) {
  return role === "VIEWER" || role === "COORDINATOR" || role === "ADMIN";
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/sign-in");

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      protocolNumber: true,
      date: true,
      description: true,
      descriptionText: true,
      createdAt: true,
      updatedAt: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      creator: {
        select: {
          id: true,
          displayName: true,
          name: true,
        },
      },
      protocolCases: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          case: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      },

      comments: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          content: true,
          contentText: true,
          createdAt: true,
          updatedAt: true,
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
      mentions: {
        distinct: ["mentionedUserId"],
        select: {
          mentionedUser: {
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

  if (!protocol) return NotProduct();

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: protocol.organizationId,
        userId: session.user.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) return NotProduct();

  // const editable = canEdit(membership.role);
  const commentable = canComment(membership.role);

  const activity = await prisma.activity.findMany({
    where: {
      organizationId: protocol.organizationId,
      OR: [
        { targetType: "protocol", targetId: protocol.id },
        {
          targetType: "protocol_comment",
          targetId: { in: protocol.comments.map((c) => c.id) },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      metadata: true,
      user: {
        select: { id: true, displayName: true, name: true, avatarUrl: true },
      },
    },
  });

  const creatorName =
    protocol.creator.displayName ||
    protocol.creator.name ||
    `User ${protocol.creator.id.slice(0, 6)}`;

  return (
    <div className="w-full grid grid-cols-9 gap-4">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-10 col-span-7 ">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-semibold",
                  orgTypeBadge(protocol.organization.type).className,
                )}
                title={protocol.organization.type}>
                {orgTypeBadge(protocol.organization.type).label}
              </span>
              <span className="text-sm text-muted-foreground">
                {protocol.organization.name}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                #{protocol.protocolNumber} · {protocol.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Erstellt von {creatorName} ·{" "}
                {protocol.date.toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              render={<Link href="/protocols" />}
              variant="outline"
              className="rounded-full">
              <ChevronLeft className="size-4" /> Zurück
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Bearbeiten</h2>

          <EditProtocolForm
            protocol={{
              id: protocol.id,
              title: protocol.title,
              date: protocol.date.toISOString().slice(0, 10),
              description: (protocol.description as TElement[]) ?? [],
              organizationId: protocol.organizationId,
            }}
          />
        </div>

        <Separator />

        {/* Kommentar Block */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Kommentare</h2>

          {commentable ? (
            <ProtocolCommentForm
              protocolId={protocol.id}
              organizationId={protocol.organizationId}
            />
          ) : null}

          {/* Diskussion */}
          <Timeline>
            {protocol.comments.map((comment, k) => {
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
                    <TimelineTitle className="mt-0.5 flex items-center gap-2">
                      {userName}
                      <span className="text-muted-foreground text-xs font-light pb-px">
                        {formatDistanceToNow(comment.createdAt, {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                    </TimelineTitle>
                    <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-6 items-center justify-center border-none">
                      <Avatar>
                        <AvatarImage
                          alt={comment.user.avatarUrl ?? ""}
                          className="size-6 rounded-full"
                          src={comment.user.avatarUrl ?? undefined}
                        />
                        <AvatarFallback>
                          {getInitials(
                            comment.user.displayName ??
                              comment.user.name ??
                              "User",
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent className="mt-2 text-foreground">
                    <RichTextRenderer value={comment.content} />
                    <TimelineDate className="mt-2 mb-0 flex items-center gap-1">
                      <Button variant="ghost" className="rounded-full">
                        <Like className="size-4! text-muted-foreground" />
                      </Button>
                      <span className="">0</span>
                    </TimelineDate>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </section>

        {/* Aktivitäten */}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Aktivität</h2>
          <Timeline defaultValue={activity.length}>
            {activity.map((a, idx) => {
              const step = activity.length - idx;
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
                    <TimelineTitle className="mt-0.5 capitalize">
                      {actionMeta(a.action).shortLabel}
                    </TimelineTitle>
                    <TimelineIndicator className="bg-primary/10 group-data-completed/timeline-item:bg-primary/10 group-data-completed/timeline-item:text-primary flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7">
                      <Icon className="size-3.5" />
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent>
                    <ActivityLine
                      activity={{
                        action: a.action,
                        targetType: a.targetType,
                        targetId: a.id,
                        metadata: (a.metadata ?? {}) as any,
                        user: a.user,
                      }}
                    />
                    <TimelineDate className="mb-0 mt-1">
                      {formatDistanceToNow(a.createdAt, {
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
      {/* Aktion */}
      <div className="hidden md:block gap-4 mt-24  col-span-2 h-screen sticky top-10 px-4">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Verknüpfte Fälle</h2>

          <div className="divide-y space-y-2">
            {protocol.protocolCases.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Noch keine Fälle verknüpft.
              </div>
            ) : (
              protocol.protocolCases.map((entry) => (
                <Link
                  href={`/cases/${entry.case.id}`}
                  key={entry.id}
                  className={`flex items-start justify-between gap-4 text-sm pb-2 ${entry.case.status === "CLOSED" ? "opacity-70" : ""}`}>
                  <div className="min-w-0">
                    <div className="truncate">
                      <span className="font-medium">
                        #{entry.case.caseNumber}{" "}
                      </span>
                      · {entry.case.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Badge
                        size="sm"
                        variant={priorityVariant(entry.case.priority)}>
                        {PRIORITY_LABEL[entry.case.priority]}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs">
                        {entry.case.status === "WAITING" ? (
                          <Clock className="size-3 " />
                        ) : entry.case.status === "CLOSED" ? (
                          <CircleCheck className="size-3 text-blue-500" />
                        ) : entry.case.status === "IN_PROGRESS" ? (
                          <Loader className="size-3  text-amber-500" />
                        ) : entry.case.status === "OPEN" ? (
                          <Circle className="size-3 text-green-500" />
                        ) : null}
                        {STATUS_LABEL[entry.case.status]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Erwähnt</h2>

          {protocol.mentions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Noch niemand erwähnt.
            </p>
          ) : (
            <div className="-space-x-3 flex mt-5">
              {protocol.mentions.slice(0, 6).map((m) => {
                const u = m.mentionedUser;
                const name =
                  u.displayName ?? u.name ?? `User ${u.id.slice(0, 6)}`;

                return (
                  <Tooltip key={u.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/m/${u.id}`}
                        className="ring-2 ring-background rounded-full transition-transform hover:z-10 hover:scale-105">
                        <Avatar className="size-10">
                          <AvatarImage
                            src={u.avatarUrl ?? undefined}
                            alt={name}
                          />
                          <AvatarFallback>{getInitials(name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    </TooltipTrigger>

                    <TooltipContent>{name}</TooltipContent>
                  </Tooltip>
                );
              })}

              {protocol.mentions.length > 6 ? (
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground text-xs ring-2 ring-background">
                  +{protocol.mentions.length - 6}
                </span>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
