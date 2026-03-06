import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { richTextToPlainText } from "@/lib/utils/protocols/rich-text";
import {
  addProtocolCommentAction,
  updateProtocolAction,
} from "@/app/(app)/actions/protocols";

import RichTextRenderer from "@/components/protocols/rich-text-renderer";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

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
    <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-10">
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

      {editable ? (
        <>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Bearbeiten</h2>

            <form
              action={updateProtocolAction}
              className="space-y-4 rounded-2xl border p-5">
              <input type="hidden" name="protocolId" value={protocol.id} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field className="gap-2">
                  <FieldLabel htmlFor="title">Titel</FieldLabel>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={protocol.title}
                    required
                  />
                </Field>

                <Field className="gap-2">
                  <FieldLabel htmlFor="date">Datum</FieldLabel>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={protocol.date.toISOString().slice(0, 10)}
                    required
                  />
                </Field>
              </div>

              <Field className="gap-2">
                <FieldLabel htmlFor="description">Beschreibung</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  rows={14}
                  defaultValue={
                    protocol.descriptionText ??
                    richTextToPlainText(protocol.description)
                  }
                />
                <FieldDescription>
                  Später ersetzen wir dieses Feld durch Plate.
                </FieldDescription>
              </Field>

              <div className="flex justify-end">
                <Button type="submit" className="rounded-full">
                  Änderungen speichern
                </Button>
              </div>
            </form>
          </div>

          <Separator />
        </>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Beschreibung</h2>
        <div className="rounded-2xl border p-5">
          <RichTextRenderer value={protocol.description} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Verknüpfte Fälle</h2>

        <div className="rounded-2xl border divide-y">
          {protocol.protocolCases.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Noch keine Fälle verknüpft.
            </div>
          ) : (
            protocol.protocolCases.map((entry) => (
              <div
                key={entry.id}
                className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    #{entry.case.caseNumber} · {entry.case.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.case.status} · {entry.case.priority}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="rounded-full">
                  <Link href={`/cases/${entry.case.id}`}>Fall öffnen</Link>
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Kommentare</h2>

        {commentable ? (
          <form
            action={addProtocolCommentAction}
            className="rounded-2xl border p-5 space-y-4">
            <input type="hidden" name="protocolId" value={protocol.id} />

            <Field className="gap-2">
              <FieldLabel htmlFor="content">Neuer Kommentar</FieldLabel>
              <Textarea
                id="content"
                name="content"
                rows={6}
                placeholder="Schreibe einen Kommentar…"
                required
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Kommentar speichern
              </Button>
            </div>
          </form>
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
  );
}
