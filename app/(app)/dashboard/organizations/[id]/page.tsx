// app/dashboard/organizations/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  ChevronLeft,
  GitPullRequestCreateArrow,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { NotProduct } from "@/components/not-product";
import { Loading } from "@/components/loading-component";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  LIMITED: "Eingeschränkt",
  VIEWER: "Betrachter",
  COORDINATOR: "Koordinator",
  ADMIN: "Admin",
};

// const ROLE_COLORS: Record<string, string> = {
//   LIMITED: "secondary",
//   VIEWER: "secondary",
//   COORDINATOR: "default",
//   ADMIN: "destructive",
// } as const;

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
  };
};

type OrgDetail = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
  members: Member[];
};

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/organizations/${id}/members`);
    const json = await res.json();

    if (!res.ok) {
      setOrg(null);
      setLoading(false);
      return;
    }

    setOrg(json);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  async function handleRoleChange(userId: string, role: string) {
    setSavingId(userId);
    await fetch(`/api/admin/organizations/${id}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSavingId(null);
    load();
  }

  async function handleRemove() {
    if (!removeTarget) return;
    await fetch(
      `/api/admin/organizations/${id}/members/${removeTarget.user.id}`,
      {
        method: "DELETE",
      },
    );
    setRemoveTarget(null);
    load();
  }

  function memberName(m: Member) {
    if (m.user.displayName) return m.user.displayName;
    if (m.user.firstName || m.user.lastName)
      return [m.user.firstName, m.user.lastName].filter(Boolean).join(" ");
    return m.user.email;
  }

  if (loading) {
    return <Loading />;
  }

  if (!org) {
    return NotProduct();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/organizations")}>
            <ChevronLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{org.name}</h1>
          </div>
          {org.isArchived && <Badge variant="outline">Archiviert</Badge>}
        </div>
        <Link href={`/dashboard/organizations/${org.id}/invitations`}>
          <Button variant="ghost" size="sm">
            <GitPullRequestCreateArrow className="size-4 mr-2" />
            Beitrittsanfragen
          </Button>
        </Link>
      </div>

      <div>
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
                <TableCell className="font-medium">{memberName(m)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {m.user.email}
                </TableCell>
                <TableCell>
                  <Select
                    value={m.role}
                    items={Object.keys(ROLE_LABELS).map((val) => ({
                      value: val,
                      label: ROLE_LABELS[val] ?? val,
                    }))}
                    disabled={savingId === m.user.id}
                    onValueChange={(val) =>
                      handleRoleChange(m.user.id, val ?? "")
                    }>
                    <SelectTrigger className="h-7 w-36  rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup alignItemWithTrigger={false}>
                      {Object.entries(ROLE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {format(new Date(m.joinedAt), "dd. MMM yyyy", { locale: de })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7">
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
      </div>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget && memberName(removeTarget)} wird aus {org.name}{" "}
              entfernt. Diese Aktion kann rückgängig gemacht werden, indem du
              den User neu einlädst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="destructive-outline">Abbrechen</Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Entfernen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
