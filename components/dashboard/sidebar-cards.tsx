import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Stethoscope, Languages, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResourcesCard({
  doctors,
  interpreters,
}: {
  doctors: number;
  interpreters: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktive Ressourcen</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pt-0">
        <Link
          href="/resources"
          className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/40 transition-colors">
          <Stethoscope className="size-5 text-sky-500" />
          <div>
            <div className="text-2xl font-semibold tabular-nums">{doctors}</div>
            <div className="text-xs text-muted-foreground">Ärzt:innen</div>
          </div>
        </Link>
        <Link
          href="/resources"
          className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/40 transition-colors">
          <Languages className="size-5 text-emerald-500" />
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {interpreters}
            </div>
            <div className="text-xs text-muted-foreground">
              Dolmetscher:innen
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

export function UpcomingEventsCard({
  events,
}: {
  events: {
    id: string;
    title: string;
    startsAt: Date;
    location: string | null;
    color: string;
    organization: { name: string } | null;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="size-4" />
          Anstehende Termine
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {events.length === 0 ? (
          <div className="text-sm text-muted-foreground">Keine Termine.</div>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors">
                <Link href="/events" className="block">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm leading-snug">
                      {e.title}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {format(e.startsAt, "dd.MM. HH:mm", { locale: de })}
                    </span>
                  </div>
                  {e.location || e.organization ? (
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {e.location ? <span>{e.location}</span> : null}
                      {e.organization && e.location ? <span>·</span> : null}
                      {e.organization ? (
                        <span>{e.organization.name}</span>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
