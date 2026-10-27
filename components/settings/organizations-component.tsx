"use client";

import Link from "next/link";
import { formatDistance } from "date-fns";
import { de } from "date-fns/locale";
import { ArchiveX, HeartPlus, Package2, SmilePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../ui/alert";
import { LeaveOrgDialog } from "./leave-org-dialog-component";
import { ROLE_LABEL } from "@/lib/utils/organizations/roles";

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
  isInstanceAdmin: boolean;
};

export function OrganizationsComponent({ memberships, isInstanceAdmin }: Props) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
      <div>
        <h2 className="text-balance font-semibold">Meine Organisationen</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Organisationen, in denen du Mitglied bist. Neue Mitglieder fügt ein
          Admin der Organisation direkt hinzu.
        </p>
      </div>

      <div className="md:col-span-2 space-y-3">
        {memberships.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Du bist noch in keiner Organisation. Bitte wende dich an einen
            Admin, damit er dich hinzufügt.
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
                {ROLE_LABEL[m.role] ?? m.role} · Mitglied seit{" "}
                {formatDistance(m.joinedAt, new Date(), {
                  locale: de,
                })}
                .{" "}
                {m.organization.isArchived
                  ? "Diese Organisation ist archiviert."
                  : ""}
              </AlertDescription>
              <AlertAction>
                {m.role === "ADMIN" || isInstanceAdmin ? (
                  <Button
                    size="xs"
                    variant="outline"
                    className="rounded-full"
                    render={
                      <Link
                        href={`/dashboard/organizations/${m.organization.id}`}
                      />
                    }>
                    Mitglieder verwalten
                  </Button>
                ) : null}
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
            </Alert>
          ))
        )}
      </div>
    </div>
  );
}
