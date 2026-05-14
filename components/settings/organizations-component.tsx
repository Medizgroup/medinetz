/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useActionState } from "react";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  acceptInviteAction,
  declineInviteAction,
  requestJoinAction,
  searchOrganizationsAction,
  type OrgSearchResult,
} from "@/app/(app)/actions/users/organizations";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../ui/alert";
import {
  ArchiveX,
  CircleAlertIcon,
  CircleCheckIcon,
  Clock,
  HeartPlus,
  Package2,
  SmilePlus,
  Store,
} from "lucide-react";
import { LeaveOrgDialog } from "./leave-org-dialog-component";
import { toastManager } from "../ui/toast";
import { Spinner } from "../ui/spinner";

type Props = {
  memberships: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
      isArchived: boolean;
    };
  }>;
  invites: Array<{
    id: string;
    role: string;
    email: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
      isArchived: boolean;
    };
    inviter: { id: string; name: string | null; email: string } | null;
  }>;
  joinRequests: Array<{
    id: string;
    status: string;
    createdAt: Date;
    message: string | null;
    organization: { id: string; name: string; slug: string; type: string };
  }>;
};

const initial = {
  ok: false,
  errors: {} as Record<string, string | string[]>,
  message: "",
};

export function OrganizationsComponent({
  memberships,
  invites,
  joinRequests,
}: Props) {
  const [acceptState, acceptAct] = useActionState(acceptInviteAction, initial);
  const [declineState, declineAct] = useActionState(
    declineInviteAction,
    initial,
  );
  const [joinState, joinAct] = useActionState(requestJoinAction, initial);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<OrgSearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<OrgSearchResult | null>(
    null,
  );

  React.useEffect(() => {
    if (selectedOrg) return; // nicht weitersuchen, wenn schon gewählt
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let ignore = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchOrganizationsAction(q);
      if (ignore) return;
      setResults(res.ok ? res.results : []);
      setSearching(false);
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [query, selectedOrg]);

  React.useEffect(() => {
    if (acceptState.ok || joinState.ok) {
      toastManager.add({
        title: "Success",
        description: `${acceptState.ok ? "Du bist jetzt Mitglied der Organisation." : joinState.message}`,
        type: "success",
      });
    }
    if (joinState.ok) {
      setSelectedOrg(null);
      setQuery("");
      setResults([]);
    }
    if (declineState.ok) {
      toastManager.add({
        title: "Einladung abgelehnt.",
        type: "info",
      });
    }
  }, [acceptState.ok, joinState.ok, joinState.message, declineState.ok]);

  return (
    <div className="space-y-10">
      {/* Meine Orgas */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="text-balance font-semibold">Meine Organisationen</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Organisationen, in denen du Mitglied bist.
          </p>
        </div>

        <div className="md:col-span-2 space-y-3">
          {memberships.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Du bist noch in keiner Organisation.
            </div>
          ) : (
            memberships.map((m) => (
              <Alert key={m.id}>
                {m.organization.isArchived ? (
                  <ArchiveX />
                ) : m.organization.type === "ROUTINE" ? (
                  <Package2 />
                ) : m.organization.type === "PREGNANCY" ? (
                  <HeartPlus />
                ) : (
                  <SmilePlus />
                )}
                <AlertTitle>{m.organization.name}</AlertTitle>
                <AlertDescription className="flex-row">
                  Du bist Mitglied seit{" "}
                  {formatDistance(m.joinedAt, new Date(), {
                    locale: de,
                  })}
                  .{" "}
                  {m.organization.isArchived
                    ? "Diese Organisation ist archiviert."
                    : ""}
                </AlertDescription>
                <AlertAction>
                  <AlertAction>
                    <LeaveOrgDialog
                      membershipId={m.id}
                      orgName={m.organization.name}
                      orgType={
                        m.organization.type as
                          | "ROUTINE"
                          | "PREGNANCY"
                          | "MANAGEMENT"
                          | "CUSTOM"
                      }
                    />
                  </AlertAction>
                </AlertAction>
              </Alert>
            ))
          )}
        </div>
      </div>

      <Separator />

      {/* Einladungen */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="text-balance font-semibold">Einladungen</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Offene Einladungen, die du annehmen oder ablehnen kannst.
          </p>
        </div>

        <div className="md:col-span-2 space-y-3">
          {invites.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Keine offenen Einladungen.
            </div>
          ) : (
            invites.map((inv) => (
              <Alert key={inv.id}>
                <SmilePlus />
                <AlertTitle>{inv.organization.name}</AlertTitle>
                <AlertDescription className="inline-flex flex-row">
                  <span className="text-foreground"> {inv.inviter?.name}</span>
                  hat dich eingeladen. Die Einladung läuft ab in
                  <span className="text-foreground">
                    {formatDistance(inv.expiresAt, new Date(), {
                      includeSeconds: true,
                      locale: de,
                    })}
                  </span>
                </AlertDescription>
                <AlertAction>
                  <Form action={declineAct} errors={declineState.errors}>
                    <Field>
                      <input type="hidden" name="inviteId" value={inv.id} />
                      <Button
                        className="rounded-full"
                        variant="destructive-outline"
                        size="xs"
                        type="submit">
                        Ablehnen
                      </Button>
                      <FieldError />
                    </Field>
                  </Form>
                  <Form action={acceptAct} errors={acceptState.errors}>
                    <Field>
                      <input type="hidden" name="inviteId" value={inv.id} />
                      <Button className="rounded-full" type="submit" size="xs">
                        Annehmen
                      </Button>
                      <FieldError />
                    </Field>
                  </Form>
                </AlertAction>
              </Alert>
            ))
          )}
        </div>
      </div>

      <Separator />

      {/* Beitrittsanfrage */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div>
          <h2 className="text-balance font-semibold">Organisation beitreten</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Suche eine Organisation und sende eine Beitrittsanfrage.
          </p>
        </div>

        <div className="md:col-span-2">
          {!selectedOrg ? (
            <div className="space-y-2">
              <Field className="gap-2">
                <FieldLabel>Organisation suchen</FieldLabel>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name oder ID der Organisation…"
                />
              </Field>

              {query.trim().length >= 2 && (
                <div className="rounded-xl border divide-y">
                  {searching ? (
                    <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Spinner className="size-3.5 opacity-75" />
                      Suche…
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      Keine Organisation gefunden.
                    </div>
                  ) : (
                    results.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrg(org);
                          setResults([]);
                        }}
                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted">
                        <OrgIcon type={org.type} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {org.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {org.slug}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <Form
              action={joinAct}
              errors={joinState.errors}
              className="space-y-4">
              <Field name="organizationId" className="gap-2">
                <FieldLabel>Ausgewählte Organisation</FieldLabel>
                <div className="flex items-center j w-full ustify-between gap-3 rounded-xl border p-3">
                  <div className="flex min-w-0 w-full items-center gap-3">
                    <OrgIcon type={selectedOrg.type} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {selectedOrg.name}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="rounded-full"
                    onClick={() => {
                      setSelectedOrg(null);
                      setQuery("");
                    }}>
                    Andere wählen
                  </Button>
                </div>
                <input
                  type="hidden"
                  name="organizationId"
                  value={selectedOrg.id}
                />
                <FieldError />
              </Field>

              <Field name="message" className="gap-2">
                <FieldLabel>Nachricht (optional)</FieldLabel>
                <Textarea
                  name="message"
                  rows={4}
                  placeholder="Kurz erklären, warum du beitreten möchtest…"
                />
                <FieldError />
              </Field>

              <Button type="submit" className="rounded-full whitespace-nowrap">
                Anfrage senden
              </Button>
            </Form>
          )}

          {!joinState.ok && joinState.message ? (
            <p className="mt-3 text-sm text-destructive">{joinState.message}</p>
          ) : null}

          {joinRequests.length ? (
            <div className="mt-6 space-y-2">
              <div className="text-sm font-medium">Deine Anfragen</div>
              {joinRequests.map((jr) => (
                <Alert
                  key={jr.id}
                  variant={
                    jr.status === "PENDING"
                      ? "warning"
                      : jr.status === "REJECTED"
                        ? "error"
                        : "success"
                  }>
                  {jr.status === "PENDING" ? (
                    <Clock />
                  ) : jr.status === "REJECTED" ? (
                    <CircleAlertIcon />
                  ) : (
                    <CircleCheckIcon />
                  )}
                  <AlertTitle>{jr.organization.name}</AlertTitle>
                  <AlertDescription>
                    {jr.message ? (
                      <>
                        {jr.message} <br />{" "}
                      </>
                    ) : (
                      ""
                    )}
                    <span className="text-xs">
                      vor{" "}
                      {formatDistance(jr.createdAt, new Date(), {
                        includeSeconds: true,
                        locale: de,
                      })}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrgIcon({ type }: { type: string }) {
  if (type === "ROUTINE") return <Package2 className="size-4 shrink-0" />;
  if (type === "PREGNANCY") return <HeartPlus className="size-4 shrink-0" />;
  return <Store className="size-4 shrink-0" />;
}
