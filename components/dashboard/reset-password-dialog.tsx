/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { Check, Copy, KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";

const TEMP_PASSWORD = "password";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string } | null;
};

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: Props) {
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setDone(false);
      setCopied(false);
      setSaving(false);
    }
  }, [open]);

  async function handleReset() {
    if (!user) return;
    setSaving(true);
    const r = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: "POST",
    });
    setSaving(false);

    if (!r.ok) {
      const d = await r.json().catch(() => null);
      toast.error(d?.error ?? "Passwort konnte nicht zurückgesetzt werden.");
      return;
    }
    setDone(true);
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(TEMP_PASSWORD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Passwort zurücksetzen</DialogTitle>
          <DialogDescription>
            {done
              ? `Neues temporäres Passwort für ${user.name}`
              : `Setzt das Passwort von ${user.name} zurück.`}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          {done ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <KeyRound className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <code className="flex-1 text-lg font-semibold tracking-wide text-amber-700 dark:text-amber-400">
                  {TEMP_PASSWORD}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-amber-500/40"
                  onClick={copyPassword}>
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? "Kopiert" : "Kopieren"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Gib dieses Passwort {user.name} auf einem sicheren Weg durch.
                Beim nächsten Login wird{" "}
                {user.name.split(" ")[0] || "die Person"} automatisch zur
                Vergabe eines eigenen, neuen Passworts aufgefordert.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <TriangleAlert className="size-5 shrink-0 text-destructive" />
                <p className="text-sm text-foreground">
                  Das aktuelle Passwort von{" "}
                  <span className="font-medium">{user.name}</span> wird
                  sofort ungültig und auf{" "}
                  <code className="font-semibold">{TEMP_PASSWORD}</code>{" "}
                  gesetzt. Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>
            </div>
          )}
        </DialogPanel>

        <DialogFooter>
          {done ? (
            <Button
              className="rounded-full"
              onClick={() => onOpenChange(false)}>
              Fertig
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={saving}
                onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={saving}
                onClick={handleReset}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Passwort zurücksetzen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
