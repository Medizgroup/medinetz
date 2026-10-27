"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, UserRoundPlus } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotProduct } from "@/components/not-product";
import { Loading } from "@/components/loading-component";
import UserAvatar from "@/components/user/user-avatar";
import AddMemberDialog from "@/components/dashboard/add-member-dialog";
import { ROLE_OPTIONS } from "@/lib/utils/organizations/roles";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    name: string | null;
    avatarUrl: string | null;
    isActive: boolean;
  };
};

type OrgDetail = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
  canAddInactive: boolean;
  members: Member[];
};

function memberName(m: Member) {
  return m.user.displayName || m.user.name || m.user.email;
}

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/organizations/${id}/members`, {
      cache: "no-store",
    });
    setOrg(res.ok ? await res.json() : null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRoleChange(userId: string, role: string) {
    setSavingId(userId);
    const res = await fetch(`/api/admin/organizations/${id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSavingId(null);
    if (!res.ok) toast.error("Rolle konnte nicht geändert werden.");
    load();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const res = await fetch(
      `/api/admin/organizations/${id}/members/${removeTarget.user.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) toast.error("Mitglied konnte nicht entfernt werden.");
    setRemoveTarget(null);
    load();
  }

  if (loading) return <Loading />;
  if (!org) return NotProduct();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Zurück"
            onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              {org.members.length} Mitglieder
            </p>
          </div>
          {org.isArchived && <Badge variant="outline">Archiviert</Badge>}
        </div>
        {!org.isArchived ? (
          <Button className="rounded-full" onClick={() => setAddOpen(true)}>
            <UserRoundPlus className="size-4" />
            Mitglied hinzufügen
          </Button>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Beigetreten</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {org.members.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground">
                Keine Mitglieder.
              </TableCell>
            </TableRow>
          )}
          {org.members.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <UserAvatar
                    name={memberName(m)}
                    avatarUrl={m.user.avatarUrl}
                    size={24}
                  />
                  {memberName(m)}
                  {!m.user.isActive ? (
                    <Badge variant="outline" size="sm">
                      Inaktiv
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.user.email}
              </TableCell>
              <TableCell>
                <Select
                  value={m.role}
                  items={ROLE_OPTIONS}
                  disabled={savingId === m.user.id}
                  onValueChange={(val) =>
                    val && handleRoleChange(m.user.id, val)
                  }>
                  <SelectTrigger className="h-7 w-36 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup alignItemWithTrigger={false}>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(m.joinedAt), "dd. MMM yyyy", { locale: de })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Aktionen">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setRemoveTarget(m)}>
                      Entfernen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        orgId={org.id}
        orgName={org.name}
        includeInactive={org.canAddInactive}
        existingUserIds={org.members.map((m) => m.user.id)}
        onAdded={load}
      />

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget ? memberName(removeTarget) : ""} wird aus{" "}
              {org.name} entfernt. Du kannst die Person jederzeit wieder
              hinzufügen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Entfernen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
