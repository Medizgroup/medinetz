"use client";

import * as React from "react";

import ProtocolEditor, {
  type CollabConfig,
  type PresenceUser,
} from "@/components/protocols/protocol-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Users } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toastManager } from "../ui/toast";
import { Label } from "../ui/label";
import { Alert, AlertTitle } from "../ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "@/lib/helper/user";
import { UsersGroupRounded, UsersGroupTwoRounded } from "@solar-icons/react-perf/category/style/LineDuotone";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import UserDefaultAvatar from "../user/user-default-avatar";
import Link from "next/link";

export default function EditProtocolForm({
  protocol,
  canEdit = true,
  collab,
}: {
  protocol: {
    id: string;
    organizationId: string;
    title: string;
    date: string;
  };
  /** false = reine:r Betrachter:in: nur Lesen, kein Titel-/Datum-Formular. */
  canEdit?: boolean;
  /** Live-Kollaborations-Konfiguration (Yjs/Hocuspocus) für den Editor-Inhalt. */
  collab: CollabConfig;
}) {
  const [title, setTitle] = React.useState(protocol.title);
  const [date, setDate] = React.useState<Date | undefined>(
    protocol.date ? new Date(protocol.date) : undefined,
  );
  const [waitingPosition, setWaitingPosition] = React.useState<number | null>(null);
  const [presence, setPresence] = React.useState<PresenceUser[]>([]);

  async function saveMeta(patch: { title?: string; date?: Date }) {
    const res = await fetch(`/api/protocols/${protocol.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...("title" in patch ? { title: patch.title } : {}),
        ...("date" in patch ? { date: patch.date ? format(patch.date, "yyyy-MM-dd") : null } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toastManager.add({
        title: "Fehler",
        description: data?.error ?? "Speichern fehlgeschlagen.",
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-4 p-5">
      {waitingPosition !== null ? (
        <Alert variant="info">
          <UsersGroupTwoRounded className="size-4.5!" />
          <AlertTitle>
            Gerade bearbeiten bereits 3 Personen dieses Protokoll. Du bist Position{" "}
            {waitingPosition} in der Warteschlange und siehst live mit.
          </AlertTitle>
        </Alert>
      ) : null}

      {canEdit ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field className="min-w-0 gap-2">
            <FieldLabel>Titel</FieldLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title.trim() && title !== protocol.title) saveMeta({ title });
              }}
            />
          </Field>

          <Field className="min-w-0 gap-2">
            <FieldLabel>Datum</FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    className="w-full justify-start text-left font-normal"
                    variant="outline"
                  />
                }>
                <CalendarIcon />
                {date ? (
                  format(date, "PPP", { locale: de })
                ) : (
                  <span> Datum auswählen</span>
                )}
              </PopoverTrigger>
              <PopoverPopup align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) saveMeta({ date: d });
                  }}
                />
              </PopoverPopup>
            </Popover>
          </Field>

          {presence.length > 0 ? (
            <div className="flex items-center -space-x-2 pb-1.5" title="Gerade live dabei">
              {presence.map((user) => (
                <Tooltip key={user.userId}>
                  <TooltipTrigger asChild>
                    <Link
                      className="ring-2 ring-background rounded-full transition-transform hover:z-10 hover:scale-105"
                      href={`/m/${user.userId}`}>

                      {user.avatarUrl
                        ?
                        <Avatar
                          key={user.userId}
                          className="size-7 border-2 border-background"
                          style={{ backgroundColor: user.color }}
                          title={user.userName}>
                          <AvatarImage src={user.avatarUrl ?? ""} />
                          <AvatarFallback
                            className="text-[10px] text-white"
                            style={{ backgroundColor: user.color }}>
                            {getInitials(user.userName)}
                          </AvatarFallback>
                        </Avatar>
                        :
                        <UserDefaultAvatar name={user.userName} size={26} />
                      }
                    </Link>

                  </TooltipTrigger>
                  <TooltipContent>{user.userName}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {canEdit ? <Label>Beschreibung</Label> : null}
      <ProtocolEditor
        organizationId={protocol.organizationId}
        canEdit={canEdit}
        collab={collab}
        onAccessChange={(status, position) =>
          setWaitingPosition(status === "waiting" ? (position ?? 0) : null)
        }
        onPresenceChange={setPresence}
      />
    </div>
  );
}
