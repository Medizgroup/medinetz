/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SECTION_LABELS: Record<string, string> = {
  home: "Home",
  cases: "Fälle",
  protocols: "Protokolle",
  events: "Termine",
  todos: "Todos",
  notifications: "Benachrichtigungen",
  doctors: "Ärzt:innen",
  interpreters: "Dolmetscher:innen",
  donations: "Spenden",
  expenses: "Ausgaben",
  budgets: "Budgets",
  settings: "Einstellungen",
  organizations: "Organisationen",
  m: "Mitglieder",
  admin: "Admin",
  profile: "Profil",
  account: "Konto",
  activities: "Aktivitäten",
  dashboard: "Dashboard",
  finance: "Finanzen",
  appearance: "Erscheinungsbild",
};

const ACTION_LABELS: Record<string, string> = {
  new: "Neu",
  edit: "Bearbeiten",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(s: string) {
  return UUID_REGEX.test(s);
}

type Crumb = {
  label: string;
  href?: string;
};

type ResolvedLabels = {
  cases: Record<string, { caseNumber: number; title: string }>;
  protocols: Record<string, { protocolNumber: number; title: string }>;
  users: Record<string, string>;
};

export default function BreadcrumbComponent() {
  const pathname = usePathname() ?? "/";
  const segments = React.useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname],
  );

  // IDs sammeln, die wir auflösen müssen
  const idsToResolve = React.useMemo(() => {
    const ids: { context: "case" | "protocol" | "user"; id: string }[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prev = segments[i - 1];
      if (!isUUID(seg)) continue;
      if (prev === "cases") ids.push({ context: "case", id: seg });
      else if (prev === "protocols") ids.push({ context: "protocol", id: seg });
      else if (prev === "m") ids.push({ context: "user", id: seg });
    }
    return ids;
  }, [segments]);

  const [labels, setLabels] = React.useState<ResolvedLabels>({
    cases: {},
    protocols: {},
    users: {},
  });

  // IDs auf dem Server auflösen lassen
  React.useEffect(() => {
    if (idsToResolve.length === 0) {
      setLabels({ cases: {}, protocols: {}, users: {} });
      return;
    }

    const controller = new AbortController();

    fetch("/api/breadcrumb-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsToResolve }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ResolvedLabels | null) => {
        if (data) setLabels(data);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [idsToResolve]);

  // Crumbs bauen
  const crumbs = React.useMemo<Crumb[]>(() => {
    if (segments.length === 0) {
      return [{ label: "Home" }];
    }

    const result: Crumb[] = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prev = segments[i - 1];
      const href = "/" + segments.slice(0, i + 1).join("/");

      let label: string;

      if (isUUID(seg)) {
        if (prev === "cases") {
          const c = labels.cases[seg];
          label = c ? `#${c.caseNumber} · ${c.title}` : "Fall";
        } else if (prev === "protocols") {
          const p = labels.protocols[seg];
          label = p ? `#${p.protocolNumber} · ${p.title}` : "Protokoll";
        } else if (prev === "m") {
          label = labels.users[seg] ?? `User ${seg.slice(0, 6)}`;
        } else {
          label = seg.slice(0, 8);
        }
      } else if (ACTION_LABELS[seg]) {
        label = ACTION_LABELS[seg];
      } else if (SECTION_LABELS[seg]) {
        label = SECTION_LABELS[seg];
      } else {
        label = seg.charAt(0).toUpperCase() + seg.slice(1);
      }

      result.push({ label, href });
    }

    return result;
  }, [segments, labels]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={`${i}-${c.label}`}>
              <BreadcrumbItem
                className={i === 0 ? "hidden md:block" : undefined}>
                {isLast || !c.href ? (
                  <BreadcrumbPage className="max-w-[180px] truncate">
                    {c.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={c.href} />}>
                    {c.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? (
                <BreadcrumbSeparator
                  className={i === 0 ? "hidden md:block" : undefined}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
