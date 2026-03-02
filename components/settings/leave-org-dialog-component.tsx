"use client";

import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { leaveOrganizationAction } from "@/app/(app)/actions/users/organizations";
import { toastManager } from "../ui/toast";

type Props = {
  membershipId: string;
  orgName: string;
  orgType: "ROUTINE" | "PREGNANCY" | "MANAGEMENT" | "CUSTOM";
};

export function LeaveOrgDialog({ membershipId, orgName, orgType }: Props) {
  const [open, setOpen] = React.useState(false);

  const [state, action, pending] = useActionState(
    leaveOrganizationAction,
    null,
  );

  // Wenn erfolgreich: Dialog schließen
  React.useEffect(() => {
    if (state?.ok) {
      toastManager.add({
        title: "Erfolg !",
        description: `Du hast die Organisation ${orgName} verlassen.`,
        type: "success",
      });
      setOpen(false);
    }
  }, [state, orgName]);

  const disabled = orgType === "ROUTINE";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="xs"
            variant="destructive-outline"
            className="rounded-full"
            disabled={disabled}
            title={disabled ? "ROUTINE kann nicht verlassen werden" : undefined}
          />
        }>
        Verlassen
      </DialogTrigger>

      <DialogPopup showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Organisation verlassen?</DialogTitle>
          <DialogDescription>
            Du bist dabei, <span className="font-medium">{orgName}</span> zu
            verlassen. Danach hast du keinen Zugriff mehr auf Inhalte dieser
            Organisation.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="grid gap-3">
          {orgType === "ROUTINE" ? (
            <div className="text-sm text-muted-foreground">
              Die ROUTINE-Organisation ist die Default-Organisation und kann
              nicht verlassen werden.
            </div>
          ) : (
            ""
          )}

          {!state?.ok && state?.error ? (
            <div className="text-sm text-destructive">{state.error}</div>
          ) : null}
        </DialogPanel>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" className="rounded-full" />}>
            Abbrechen
          </DialogClose>

          <form action={action}>
            <input type="hidden" name="membershipId" value={membershipId} />
            <Button
              type="submit"
              className="rounded-full"
              variant="destructive"
              disabled={disabled || pending}>
              {pending ? "Verlasse…" : "Ja, verlassen"}
            </Button>
          </form>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
