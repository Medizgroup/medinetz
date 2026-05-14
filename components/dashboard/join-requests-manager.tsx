"use client";

import * as React from "react";
import { useActionState } from "react";
import { formatDistance, format } from "date-fns";
import { de } from "date-fns/locale";
import { Check, X, Inbox } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import { getInitials } from "@/lib/helper/user";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/app/(app)/actions/organizations/join-requests";

type JoinRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
  decider: {
    id: string;
    name: string | null;
    displayName: string | null;
  } | null;
};

const initial = {
  ok: false,
  errors: {} as Record<string, string | string[]>,
  message: "",
};

const STATUS: Record<
  JoinRequest["status"],
  { label: string; variant: "warning" | "info" | "destructive" }
> = {
  PENDING: { label: "Offen", variant: "warning" },
  APPROVED: { label: "Angenommen", variant: "info" },
  REJECTED: { label: "Abgelehnt", variant: "destructive" },
};

function userLabel(u: JoinRequest["user"]) {
  return u.displayName ?? u.name ?? u.email;
}

function UserCell({ user }: { user: JoinRequest["user"] }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarImage src={user.avatarUrl ?? ""} />
        <AvatarFallback>{getInitials(userLabel(user))}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{userLabel(user)}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user.email}
        </div>
      </div>
    </div>
  );
}

export function JoinRequestsManager({
  orgId,
  requests,
}: {
  orgId: string;
  requests: JoinRequest[];
}) {
  const [approveState, approveAct] = useActionState(
    approveJoinRequestAction,
    initial,
  );
  const [rejectState, rejectAct] = useActionState(
    rejectJoinRequestAction,
    initial,
  );

  React.useEffect(() => {
    if (approveState.ok) {
      toastManager.add({
        title: "Anfrage angenommen",
        description: approveState.message,
        type: "success",
      });
    }
    if (rejectState.ok) {
      toastManager.add({
        title: "Anfrage abgelehnt",
        description: rejectState.message,
        type: "info",
      });
    }
  }, [
    approveState.ok,
    approveState.message,
    rejectState.ok,
    rejectState.message,
  ]);

  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-10">
      {/* Offene Anfragen */}
      <div className="space-y-3">
        <h2 className="font-semibold">Offen ({pending.length})</h2>

        {pending.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
            <Inbox className="size-4" />
            Keine offenen Beitrittsanfragen.
          </div>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Nachricht</TableHead>
                  <TableHead>Angefragt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <UserCell user={r.user} />
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <span className="text-sm text-muted-foreground">
                        {r.message?.trim() ? r.message : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      vor{" "}
                      {formatDistance(r.createdAt, new Date(), { locale: de })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Form action={rejectAct} errors={rejectState.errors}>
                          <Field>
                            <input
                              type="hidden"
                              name="requestId"
                              value={r.id}
                            />
                            <input
                              type="hidden"
                              name="organizationId"
                              value={orgId}
                            />
                            <Button
                              type="submit"
                              size="xs"
                              variant="destructive-outline"
                              className="rounded-full">
                              <X className="size-4" />
                              Ablehnen
                            </Button>
                            <FieldError />
                          </Field>
                        </Form>
                        <Form action={approveAct} errors={approveState.errors}>
                          <Field>
                            <input
                              type="hidden"
                              name="requestId"
                              value={r.id}
                            />
                            <input
                              type="hidden"
                              name="organizationId"
                              value={orgId}
                            />
                            <Button
                              type="submit"
                              size="xs"
                              className="rounded-full">
                              <Check className="size-4" />
                              Annehmen
                            </Button>
                            <FieldError />
                          </Field>
                        </Form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Bearbeitete Anfragen */}
      {decided.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Bearbeitet ({decided.length})</h2>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entschieden von</TableHead>
                  <TableHead>Entschieden am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decided.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <UserCell user={r.user} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS[r.status].variant}>
                        {STATUS[r.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.decider?.displayName ?? r.decider?.name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {r.decidedAt
                        ? format(r.decidedAt, "dd.MM.yyyy", { locale: de })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
