import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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
import { Circle, CircleCheck, Clock, Loader } from "lucide-react";

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
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { detailedIcon } from "@/lib/utils/index";
import { getInitials } from "@/lib/helper/user";
import ActivityLine from "@/components/activity/activity-line";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";

function orgBadge(type: string) {
  if (type === "ROUTINE") return "R";
  if (type === "PREGNANCY") return "S";
  if (type === "MANAGEMENT") return "M";
  return "C";
}

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

  if (!protocol) notFound();

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

  if (!membership) notFound();

  // const editable = canEdit(membership.role);
  const commentable = canComment(membership.role);

  const activity = await prisma.activity.findMany({
    where: {
      organizationId: protocol.organizationId,
      OR: [
        { targetType: "protocol", targetId: protocol.id },
        { targetType: "protocol_comment" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      createdAt: true,
      metadata: true,
      user: { select: { id: true, displayName: true, name: true } },
    },
  });

  const creatorName =
    protocol.creator.displayName ||
    protocol.creator.name ||
    `User ${protocol.creator.id.slice(0, 6)}`;

  return (
    <div className="w-full grid grid-cols-4 gap-4">
      <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-10 col-span-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted text-sm font-semibold">
                {orgBadge(protocol.organization.type)}
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
              render={<Link href="/protocols">Zurück</Link>}
              variant="outline"
              className="rounded-full"></Button>
          </div>
        </div>

        {/* {editable ? (
        <> */}
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
        {/* </>
      ) : null} */}

        {/* Vielleicht mal Später */}
        {/* <section className="space-y-4">
          <h2 className="text-lg font-semibold">Beschreibung</h2>
          <div className="rounded-2xl border p-5">
            <RichTextRenderer value={protocol.description} />
          </div>
        </section> */}

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
                    <TimelineTitle className="mt-0.5">{userName}</TimelineTitle>
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
                  <TimelineContent className="mt-2 rounded-lg border px-4 py-3 text-foreground">
                    <RichTextRenderer value={comment.content} />
                    <TimelineDate className="mt-1 mb-0">
                      vor{" "}
                      {formatDistance(new Date(comment.createdAt), new Date(), {
                        locale: de,
                      })}
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
                    <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-7 flex size-5 items-center justify-center border-none bg-accent">
                      <Icon size={14} className="text-muted-foreground" />
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent>
                    <ActivityLine
                      activity={{
                        action: a.action,
                        targetType: "case",
                        targetId: a.id,
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
      {/* Aktion */}
      <div className="gap-4 mt-24 ">
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
                  className="flex items-start justify-between gap-4 text-sm pb-2">
                  <div className="min-w-0">
                    <div className="truncate">
                      <span className="font-medium">
                        #{entry.case.caseNumber}{" "}
                      </span>
                      · {entry.case.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      {entry.case.status === "WAITING" ? (
                        <Clock className="size-4 " />
                      ) : entry.case.status === "CLOSED" ? (
                        <CircleCheck className="size-4 text-blue-500" />
                      ) : entry.case.status === "IN_PROGRESS" ? (
                        <Loader className="size-4  text-amber-500" />
                      ) : entry.case.status === "OPEN" ? (
                        <Circle className="size-4 text-green-500" />
                      ) : null}
                      <Badge
                        variant={
                          entry.case.priority === "HIGH"
                            ? "error"
                            : entry.case.priority === "LOW"
                              ? "info"
                              : entry.case.priority === "MEDIUM"
                                ? "warning"
                                : entry.case.priority === "URGENT"
                                  ? "destructive"
                                  : "secondary"
                        }>
                        {entry.case.priority}
                      </Badge>
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
