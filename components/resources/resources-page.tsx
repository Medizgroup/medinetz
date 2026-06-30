/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Circle, CircleCheck, Clock, Loader, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ResourceFormDialog from "./resource-form-dialog";
import ResourcesMap from "./resources-map";
import type { ResourceRow, ResourceType } from "@/lib/types/resources";
import {
  Buildings,
  Dollar,
  FolderOpen,
  Magnifier,
  MapPoint,
  PenNewSquare,
  Phone,
  SmileSquare,
} from "@solar-icons/react-perf/category/style/LineDuotone";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import Link from "next/link";
import { STATUS_LABEL } from "@/lib/utils/cases";

type Props = {
  canEdit: boolean;
};

export default function ResourcesPage({ canEdit }: Props) {
  const [resources, setResources] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Filter
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | ResourceType>(
    "ALL",
  );
  const [availabilityFilter, setAvailabilityFilter] = React.useState<
    "ALL" | "HIGH" | "MEDIUM" | "LOW"
  >("ALL");
  const [showInactive, setShowInactive] = React.useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ResourceRow | null>(null);

  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/resources");
      if (!r.ok) return;
      const data = await r.json();
      const all: ResourceRow[] = [
        ...(data.doctors as ResourceRow[]),
        ...(data.interpreters as ResourceRow[]),
      ];
      setResources(all);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  // Filtered list
  const filtered = React.useMemo(() => {
    return resources.filter((r) => {
      if (!showInactive && !r.isActive) return false;
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [
          r.name,
          r.address ?? "",
          r.phone ?? "",
          r.email ?? "",
          r.notes ?? "",
          ...r.languages,
          ...r.tags,
          r.type === "DOCTOR" ? (r.specialty ?? "") : "",
          r.type === "DOCTOR" ? (r.practiceName ?? "") : "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (availabilityFilter !== "ALL") {
        if (r.availability !== availabilityFilter) return false;
      }

      return true;
    });
  }, [resources, showInactive, typeFilter, search, availabilityFilter]);

  // Scroll-to-selected
  React.useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  function handlePinClick(r: ResourceRow) {
    setSelectedId(r.id);
  }

  function handleEdit(r: ResourceRow) {
    setEditing(r);
    setDialogOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div
      className={cn(
        " h-[calc(100vh-8rem)] ",
        !sidebarOpen ? "w-full " : "",
        // : "grid-cols-1 grid lg:grid-cols-[min(400px,40%),1fr] gap-4",
      )}>
      {/* Left panel */}
      <div className="py-2 flex items-center gap-4">
        <Button
          variant="ghost"
          className="rounded-full bg-accent"
          size="icon-lg"
          onClick={() => setSidebarOpen((v) => !v)}>
          {sidebarOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4.5 text-muted-foreground">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <Magnifier className="size-4.5 text-muted-foreground" />
          )}
          {/* <Magnifier className="size-4.5 text-muted-foreground" /> */}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={typeFilter}
            items={[
              { value: "ALL", label: "Alle Typen" },
              { value: "DOCTOR", label: "Ärzt:innen" },
              { value: "INTERPRETER", label: "Dolmetscher:innen" },
            ]}
            onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="bg-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="ALL">Alle Typen</SelectItem>
              <SelectItem value="DOCTOR">Ärzt:innen</SelectItem>
              <SelectItem value="INTERPRETER">Dolmetscher:innen</SelectItem>
            </SelectPopup>
          </Select>

          <Select
            items={[
              { value: "ALL", label: "Alle Verfügbarkeiten" },
              { value: "HIGH", label: "Hoch" },
              { value: "MEDIUM", label: "Mittel" },
              { value: "LOW", label: "Niedrig" },
            ]}
            value={availabilityFilter}
            onValueChange={(v) => setAvailabilityFilter(v as any)}>
            <SelectTrigger className="bg-accent">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup alignItemWithTrigger={false}>
              <SelectItem value="ALL">Alle Verfügbarkeiten</SelectItem>
              <SelectItem value="HIGH">Hoch</SelectItem>
              <SelectItem value="MEDIUM">Mittel</SelectItem>
              <SelectItem value="LOW">Niedrig</SelectItem>
            </SelectPopup>
          </Select>
        </div>
      </div>
      <div
        className={cn(
          "flex-col gap-3 overflow-hidden overflow-y-auto absolute h-[calc(100vh-8rem)] z-50 shadow rounded-xl max-w-md p-4 transition-transform backdrop-blur-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">
              {typeFilter === "DOCTOR"
                ? "Ärzte"
                : typeFilter === "INTERPRETER"
                  ? "Dolmetscher"
                  : "Ressourcen"}
            </h1>
            {canEdit ? (
              <Button size="sm" className="rounded-full" onClick={handleNew}>
                <Plus className="size-4" />
                Hinzufügen
              </Button>
            ) : null}
          </div>

          <div className="relative">
            <Magnifier className="pointer-events-none absolute left-2.5 top-1/2 size-4 z-10 -translate-y-1/2 opacity-60" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-6 bg-accent"
            />
          </div>

          <div className="py-2">
            <Label>
              <Checkbox
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              Alle Ressourcen anzeigen, auch inaktive
            </Label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground animate-pulse">
              Lädt…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Keine Ressourcen gefunden.
            </div>
          ) : (
            <ul className="space-y-4 rounded-lg">
              {filtered.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <li
                    key={r.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(r.id, el as any);
                    }}>
                    <div
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer p-5 transition-colors rounded-lg hover:opacity-80 ${
                        isSelected
                          ? " dark:bg-neutral-950  bg-white"
                          : "bg-accent dark:bg-accent"
                      }`}>
                      <div className="flex items-start justify-between gap-2 relative pr-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full  font-bold text-white  ${
                                r.type === "DOCTOR" ? "bg-accent" : "bg-accent"
                              }`}>
                              {r.type === "DOCTOR" ? (
                                <Buildings className="size-5 text-blue-500" />
                              ) : (
                                <SmileSquare className="size-5 text-pink-500" />
                              )}
                            </span>
                            <span className="font-medium truncate">
                              {r.name}
                            </span>
                            {!r.isActive ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px]">
                                inaktiv
                              </Badge>
                            ) : null}
                          </div>
                          {r.type === "DOCTOR" && r.specialty ? (
                            <div className="mt-0.5 text-xs text-orange-500/90 truncate">
                              {r.specialty}
                            </div>
                          ) : null}
                          {r.languages.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {r.languages.slice(0, 4).map((l) => (
                                <span
                                  key={l}
                                  className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">
                                  {l}
                                </span>
                              ))}
                              {r.languages.length > 4 ? (
                                <span className="text-[10px] text-muted-foreground">
                                  +{r.languages.length - 4}
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-2 text-xs text-foreground truncate flex items-center gap-1">
                            <Dollar className="size-4" />
                            {r.type === "DOCTOR"
                              ? (() => {
                                  const sum =
                                    r.caseDoctors &&
                                    Array.isArray(r.caseDoctors)
                                      ? r.caseDoctors
                                          .filter(
                                            (entry) =>
                                              entry.invoicePaid !== true &&
                                              entry.invoiceAmount != null,
                                          )
                                          .reduce(
                                            (total, entry) =>
                                              total +
                                              (typeof entry.invoiceAmount ===
                                              "number"
                                                ? entry.invoiceAmount
                                                : Number(entry.invoiceAmount) ||
                                                  0),
                                            0,
                                          )
                                      : 0;
                                  return (
                                    <span
                                      className={cn(
                                        sum === 0
                                          ? "text-emerald-500"
                                          : "text-rose-500",
                                      )}>
                                      {sum.toLocaleString("de-DE", {
                                        style: "currency",
                                        currency: "EUR",
                                      })}{" "}
                                      Offen
                                    </span>
                                  );
                                })()
                              : r.type === "INTERPRETER"
                                ? (() => {
                                    const sum =
                                      r.caseInterpreters &&
                                      Array.isArray(r.caseInterpreters)
                                        ? r.caseInterpreters
                                            .filter(
                                              (entry) =>
                                                entry.invoicePaid !== true &&
                                                entry.cost != null,
                                            )
                                            .reduce(
                                              (total, entry) =>
                                                total +
                                                (typeof entry.cost === "number"
                                                  ? entry.cost
                                                  : Number(entry.cost) || 0),
                                              0,
                                            )
                                        : 0;
                                    return (
                                      <span
                                        className={cn(
                                          sum === 0
                                            ? "text-emerald-500"
                                            : "text-rose-500",
                                        )}>
                                        {sum.toLocaleString("de-DE", {
                                          style: "currency",
                                          currency: "EUR",
                                        })}{" "}
                                        Offen
                                      </span>
                                    );
                                  })()
                                : null}
                          </div>

                          {/* Fälle */}
                          {r.type === "DOCTOR" && r.caseDoctors && (
                            <div className="mt-2 text-xs text-foreground flex items-center gap-1 truncate justify-start">
                              <FolderOpen className="size-4" />
                              {r.caseDoctors.filter(
                                (entry) => entry.case.status !== "CLOSED",
                              ).length === 0
                                ? null
                                : r.caseDoctors.filter(
                                    (entry) => entry.case.status !== "CLOSED",
                                  ).length}
                              {r.caseDoctors.filter(
                                (entry) => entry.case.status !== "CLOSED",
                              ).length === 0
                                ? "Noch keine Fälle"
                                : r.caseDoctors.filter(
                                      (entry) => entry.case.status !== "CLOSED",
                                    ).length === 1
                                  ? " Fall"
                                  : " Fälle"}
                            </div>
                          )}
                          {r.type === "INTERPRETER" && r.caseInterpreters && (
                            <div className="mt-2 text-xs text-foreground flex items-center gap-1 truncate justify-start">
                              <FolderOpen className="size-4" />
                              {r.caseInterpreters.filter(
                                (entry) => entry.case.status !== "CLOSED",
                              ).length === 0
                                ? null
                                : r.caseInterpreters.filter(
                                    (entry) => entry.case.status !== "CLOSED",
                                  ).length}
                              {r.caseInterpreters.filter(
                                (entry) => entry.case.status !== "CLOSED",
                              ).length === 0
                                ? "Noch keine Fälle"
                                : r.caseInterpreters.filter(
                                      (entry) => entry.case.status !== "CLOSED",
                                    ).length === 1
                                  ? " Fall"
                                  : " Fälle"}
                            </div>
                          )}

                          {r.phone && (
                            <div className="mt-2 text-xs text-foreground truncate flex items-center gap-1">
                              <Phone className="size-4" />
                              {r.phone}
                            </div>
                          )}
                          {r.address ? (
                            <div className="mt-2 text-xs text-foreground flex items-center gap-1 truncate justify-start">
                              <MapPoint className="size-4" />
                              {r.address}
                            </div>
                          ) : null}

                          <div
                            className={cn(
                              "py-4  divide-y max-h-40 overflow-y-auto",
                              isSelected ? "grid" : "hidden",
                            )}>
                            {r.type === "DOCTOR"
                              ? r.caseDoctors &&
                                [...r.caseDoctors]
                                  .sort((a, b) => {
                                    // Sort: CLOSED at end
                                    const aClosed = a.case.status === "CLOSED";
                                    const bClosed = b.case.status === "CLOSED";
                                    if (aClosed === bClosed) return 0;
                                    return aClosed ? 1 : -1;
                                  })
                                  .map((entry, k) => (
                                    <Link
                                      href={`/cases/${entry.caseId}`}
                                      key={k}
                                      className={`flex items-start py-2 justify-between text-xs ${entry.case.status === "CLOSED" ? "opacity-40" : ""}`}>
                                      <div className="min-w-0">
                                        <div className="truncate flex gap-1 items-center ">
                                          {entry.case.status === "WAITING" ? (
                                            <Clock className="size-3 " />
                                          ) : entry.case.status === "CLOSED" ? (
                                            <CircleCheck className="size-3 text-blue-500" />
                                          ) : entry.case.status ===
                                            "IN_PROGRESS" ? (
                                            <Loader className="size-3  text-amber-500" />
                                          ) : entry.case.status === "OPEN" ? (
                                            <Circle className="size-3 text-green-500" />
                                          ) : null}
                                          {
                                            STATUS_LABEL[
                                              entry.case
                                                .status as keyof typeof STATUS_LABEL
                                            ]
                                          }
                                          <span className="font-medium">
                                            #{entry.case.caseNumber}{" "}
                                          </span>
                                          · {entry.case.patient?.pseudonym}
                                        </div>
                                      </div>
                                    </Link>
                                  ))
                              : r.caseInterpreters &&
                                [...r.caseInterpreters]
                                  .sort((a, b) => {
                                    // Sort: CLOSED at end
                                    const aClosed = a.case.status === "CLOSED";
                                    const bClosed = b.case.status === "CLOSED";
                                    if (aClosed === bClosed) return 0;
                                    return aClosed ? 1 : -1;
                                  })
                                  .map((entry, k) => (
                                    <Link
                                      href={`/cases/${entry.caseId}`}
                                      key={k}
                                      className={`flex items-start py-2 justify-between text-xs ${entry.case.status === "CLOSED" ? "opacity-40" : ""}`}>
                                      <div className="min-w-0">
                                        <div className="truncate flex gap-1 items-center ">
                                          {entry.case.status === "WAITING" ? (
                                            <Clock className="size-3 " />
                                          ) : entry.case.status === "CLOSED" ? (
                                            <CircleCheck className="size-3 text-blue-500" />
                                          ) : entry.case.status ===
                                            "IN_PROGRESS" ? (
                                            <Loader className="size-3  text-amber-500" />
                                          ) : entry.case.status === "OPEN" ? (
                                            <Circle className="size-3 text-green-500" />
                                          ) : null}
                                          {
                                            STATUS_LABEL[
                                              entry.case
                                                .status as keyof typeof STATUS_LABEL
                                            ]
                                          }
                                          <span className="font-medium">
                                            #{entry.case.caseNumber}{" "}
                                          </span>
                                          · {entry.case.patient?.pseudonym}
                                        </div>
                                      </div>
                                    </Link>
                                  ))}
                          </div>
                        </div>
                        {canEdit ? (
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="absolute -top-1 -right-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(r);
                            }}>
                            <PenNewSquare className="size-5" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {filtered.length} von {resources.length} Ressourcen
        </div>
      </div>

      {/* Map */}
      <div className="relative z-0 overflow-hidden rounded-lg border h-full w-full">
        <ResourcesMap
          resources={filtered}
          selectedId={selectedId}
          onSelect={handlePinClick}
        />
      </div>

      <ResourceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType="DOCTOR"
        resource={editing}
        onSaved={reload}
      />
    </div>
  );
}
