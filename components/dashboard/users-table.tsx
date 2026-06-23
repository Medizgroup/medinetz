"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MoreHorizontal,
  MoreHorizontalIcon,
  Search,
  Shield,
  UserRoundCheck,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getInitials } from "@/lib/helper/user";
import InviteUserDialog from "./invite-user-dialog";
import { ButtonGroup } from "../ui/group";
import { DropdownMenuGroup, DropdownMenuLabel } from "../ui/menu";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import UserDefaultAvatar from "../user/user-default-avatar";

type OrgMember = {
  role: string;
  organization: { id: string; name: string };
};

type User = {
  id: string;
  email: string;
  displayName: string | null;
  name: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isInstanceAdmin: boolean;
  createdAt: string;
  organizationMembers: OrgMember[];
};

type Org = { id: string; name: string };

const ROLE_VARIANT: Record<string, "secondary" | "info" | "warning" | "error"> =
  {
    LIMITED: "secondary",
    VIEWER: "info",
    COORDINATOR: "warning",
    ADMIN: "error",
  };

export default function UsersTable({
  availableOrgs,
}: {
  availableOrgs: Org[];
}) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  const [inviteOpen, setInviteOpen] = React.useState(false);

  const pageSize = 30;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (activeFilter !== "all") params.set("active", activeFilter);

      const r = await fetch(`/api/admin/users?${params.toString()}`);
      if (!r.ok) return;
      const data = await r.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u: User) {
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (!r.ok) {
      toast.error("Fehler beim Aktualisieren.");
      return;
    }
    toast.success(`User ${!u.isActive ? "aktiviert" : "deaktiviert"}.`);
    load();
  }

  async function toggleAdmin(u: User) {
    const r = await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isInstanceAdmin: !u.isInstanceAdmin }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => null);
      toast.error(d?.error ?? "Fehler.");
      return;
    }
    toast.success(
      `Admin-Status ${!u.isInstanceAdmin ? "vergeben" : "entzogen"}.`,
    );
    load();
  }

  function handleExport() {
    window.open("/api/admin/users/export", "_blank");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  }

  async function handleBulk(action: "activate" | "deactivate") {
    setBulkLoading(true);
    await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userIds: Array.from(selected) }),
    });
    setSelected(new Set());
    setBulkLoading(false);
    load(); // deine bestehende reload-Funktion
  }
  const userName = (u: User) =>
    u.displayName ?? u.name ?? u.email.split("@")[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Name oder Email…"
              className="w-[280px] pl-6"
            />
          </div>
          <Select
            items={[
              { label: "Alle", value: "all" },
              { label: "Aktiv", value: "true" },
              { label: "Inaktiv", value: "false" },
            ]}
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle Status" />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="true">Aktiv</SelectItem>
              <SelectItem value="false">Inaktiv</SelectItem>
            </SelectPopup>
          </Select>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              {selected.size} ausgewählt
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={() => handleBulk("activate")}>
              Aktivieren
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkLoading}
              onClick={() => handleBulk("deactivate")}>
              Deaktivieren
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}>
              Auswahl aufheben
            </Button>
          </div>
        )}
        <div className="flex gap-4">
          <ButtonGroup>
            <Button
              onClick={() => setInviteOpen(true)}
              variant="outline"
              size="default"
              className="rounded-full px-4"
              aria-label="Invite Users ">
              <UserRoundPlus aria-hidden="true" />
              Einladen
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="More options"
                  className="rounded-full">
                  <MoreHorizontalIcon aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Export</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="size-4" />
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === users.length && users.length > 0}
                  onCheckedChange={() => toggleAll(users.map((u) => u.id))}
                />
              </TableHead>
              <TableHead>Benutzer</TableHead>
              <TableHead>Organisationen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground">
                  Keine Benutzer gefunden.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(u.id)}
                      onCheckedChange={() => toggleSelect(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {
                        u.avatarUrl ?
                      <Avatar
                        className="size-8 ">
                        <AvatarImage
                          src={u.avatarUrl ?? undefined}
                          alt={userName(u)}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(userName(u))}
                        </AvatarFallback>
                      </Avatar>
                      :
                      <UserDefaultAvatar name= {getInitials(userName(u))} size={30} />
                      }
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          {userName(u)}  {u.isInstanceAdmin && <Badge size="sm" variant="destructive"> Admin </Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.organizationMembers.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        u.organizationMembers.map((m, i) => (
                          <Badge
                            key={i}
                            variant={ROLE_VARIANT[m.role] ?? "secondary"}>
                            {m.organization.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "success" : "error"}>
                      {u.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(u.createdAt), "dd.MM.yyyy", {
                      locale: de,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleActive(u)}>
                            {u.isActive ? (
                              <>
                                <UserRoundX
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                Deaktivieren
                              </>
                            ) : (
                              <>
                                <UserRoundCheck
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                Aktivieren
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleAdmin(u)}>
                            <Shield className="size-4" />
                            {u.isInstanceAdmin
                              ? "Admin-Status entziehen"
                              : "Zum Admin machen"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `User "${userName(u)}" wirklich deaktivieren?`,
                                )
                              ) {
                                toggleActive({ ...u, isActive: true });
                              }
                            }}>
                            <UserRoundX className="size-4" />
                            Deaktivieren & sperren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Seite {page} von {totalPages} · {total} Benutzer
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="size-4" />
              Zurück
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Weiter
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        availableOrgs={availableOrgs}
        onInvited={load}
      />
    </div>
  );
}
