"use client";

import * as React from "react";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Org = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableOrgs: Org[];
  onInvited: () => void;
};

export default function InviteUserDialog({
  open,
  onOpenChange,
  availableOrgs,
  onInvited,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [orgId, setOrgId] = React.useState(availableOrgs[0]?.id ?? "");
  const [role, setRole] = React.useState("VIEWER");
  const [saving, setSaving] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setOrgId(availableOrgs[0]?.id ?? "");
      setRole("VIEWER");
      setInviteLink(null);
      setCopied(false);
      setError(null);
    }
  }, [open, availableOrgs]);

  async function handleInvite() {
    if (!email.trim() || !orgId) return;
    setSaving(true);
    setError(null);

    const r = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        organizationId: orgId,
        role,
      }),
    });

    const data = await r.json().catch(() => null);
    setSaving(false);

    if (!r.ok) {
      setError(data?.error ?? "Fehler beim Einladen.");
      return;
    }

    setInviteLink(data.inviteLink);
    onInvited();
    toast.success(`Einladung für ${email} erstellt.`);
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Benutzer einladen</DialogTitle>
          <DialogDescription>
            Einladungslink wird in der App angezeigt — kein E-Mail-Versand.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {error ? (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {inviteLink ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground">
                Einladungslink erstellt. Kopiere ihn und schicke ihn dem User:
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                <code className="flex-1 truncate text-xs">{inviteLink}</code>
                <Button size="sm" variant="ghost" onClick={copyLink}>
                  {copied ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Der Link ist 7 Tage gültig. Der User sieht die Einladung in
                seinen Einstellungen nach dem Login.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <Field className="gap-2">
                <FieldLabel>Email-Adresse</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.de"
                />
              </Field>

              <Field className="gap-2">
                <FieldLabel>Organisation</FieldLabel>
                <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="wählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="gap-2">
                <FieldLabel>Rolle</FieldLabel>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIMITED">Eingeschränkt</SelectItem>
                    <SelectItem value="VIEWER">Betrachter</SelectItem>
                    <SelectItem value="COORDINATOR">Koordinator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {inviteLink ? "Schließen" : "Abbrechen"}
          </Button>
          {!inviteLink ? (
            <Button
              onClick={handleInvite}
              disabled={!email.trim() || !orgId || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Einladungslink erstellen
            </Button>
          ) : null}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
