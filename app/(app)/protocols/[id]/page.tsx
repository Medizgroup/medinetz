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

function orgBadge(type: string) {
  if (type === "ROUTINE") return "R";
  if (type === "PREGNANCY") return "S";
  if (type === "MANAGEMENT") return "M";
  return "C";
}

function canEdit(role?: string) {
  return role === "COORDINATOR" || role === "ADMIN";
}

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

  const editable = canEdit(membership.role);
  const commentable = canComment(membership.role);

  const activity = await prisma.activity.findMany({
    where: {
      organizationId: protocol.organizationId,
      OR: [
        { targetType: "protocol", targetId: protocol.id },
        { targetType: "protocol_comment", targetId: protocol.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      targetType: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          name: true,
        },
      },
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
            <ProtocolCommentForm protocolId={protocol.id} />
          ) : null}

          <div className="rounded-2xl border divide-y">
            {protocol.comments.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Noch keine Kommentare vorhanden.
              </div>
            ) : (
              protocol.comments.map((comment) => {
                const userName =
                  comment.user.displayName ||
                  comment.user.name ||
                  `User ${comment.user.id.slice(0, 6)}`;

                return (
                  <div key={comment.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium">{userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {comment.createdAt.toLocaleString("de-DE")}
                      </div>
                    </div>

                    <RichTextRenderer value={comment.content} />
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Aktivitäten */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Aktivität</h2>

          <div className="rounded-2xl border divide-y">
            {activity.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Noch keine Aktivität.
              </div>
            ) : (
              activity.map((item) => {
                const actor =
                  item.user.displayName ||
                  item.user.name ||
                  `User ${item.user.id.slice(0, 6)}`;

                return (
                  <div
                    key={item.id}
                    className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{actor}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.action} · {item.targetType}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.createdAt.toLocaleString("de-DE")}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
      {/* Aktion */}
      <div className="gap-4 mt-24 ">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Verknüpfte Fälle</h2>

          <div className=" divide-y">
            {protocol.protocolCases.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Noch keine Fälle verknüpft.
              </div>
            ) : (
              protocol.protocolCases.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 text-sm">
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
                        <CircleCheck className="size-4 text-green-500" />
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

                      {/* {entry.case.status} · {entry.case.priority} */}
                    </div>
                  </div>

                  <Button variant="outline" size="xs" className="rounded-full">
                    <Link href={`/cases/${entry.case.id}`}>Fall öffnen</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
