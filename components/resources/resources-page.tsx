/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TagInput } from "./tag-input";
import ResourceFormDialog from "./resource-form-dialog";
import ResourcesMap from "./resources-map";
import type { ResourceRow, ResourceType } from "@/lib/types/resources";

type Props = {
  canEdit: boolean;
};

export default function ResourcesPage({ canEdit }: Props) {
  const [resources, setResources] = React.useState<ResourceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Filter
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | ResourceType>(
    "ALL",
  );
  const [languageFilter, setLanguageFilter] = React.useState<string[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = React.useState("");
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

      if (languageFilter.length > 0) {
        const hit = languageFilter.some((l) =>
          r.languages.some((rl) => rl.toLowerCase() === l.toLowerCase()),
        );
        if (!hit) return false;
      }

      if (specialtyFilter.trim()) {
        if (r.type !== "DOCTOR") return false;
        if (
          !r.specialty?.toLowerCase().includes(specialtyFilter.toLowerCase())
        ) {
          return false;
        }
      }

      if (availabilityFilter !== "ALL") {
        if (r.availability !== availabilityFilter) return false;
      }

      return true;
    });
  }, [
    resources,
    showInactive,
    typeFilter,
    search,
    languageFilter,
    specialtyFilter,
    availabilityFilter,
  ]);

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
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 p-4">
      {/* Left panel */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Ressourcen</h1>
            {canEdit ? (
              <Button size="sm" onClick={handleNew}>
                <Plus className="size-4" />
                Neu
              </Button>
            ) : null}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 opacity-60" />
            <Input
              placeholder="Suche nach Name, Adresse, Sprache…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={typeFilter}
              items={[
                { value: "ALL", label: "Alle Typen" },
                { value: "DOCTOR", label: "Ärzt:innen" },
                { value: "INTERPRETER", label: "Dolmetscher:innen" },
              ]}
              onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle Typen</SelectItem>
                <SelectItem value="DOCTOR">Ärzt:innen</SelectItem>
                <SelectItem value="INTERPRETER">Dolmetscher:innen</SelectItem>
              </SelectContent>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle Verfügbarkeiten</SelectItem>
                <SelectItem value="HIGH">Hoch</SelectItem>
                <SelectItem value="MEDIUM">Mittel</SelectItem>
                <SelectItem value="LOW">Niedrig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TagInput
            value={languageFilter}
            onChange={setLanguageFilter}
            placeholder="Sprache filtern…"
          />

          {typeFilter === "DOCTOR" || typeFilter === "ALL" ? (
            <Input
              placeholder="Fachrichtung filtern…"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            />
          ) : null}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Inaktive anzeigen
          </label>
        </div>

        <div className="flex-1 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Lädt…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              Keine Ressourcen gefunden.
            </div>
          ) : (
            <ul className="divide-y">
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
                      className={`cursor-pointer p-3 transition-colors ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                                r.type === "DOCTOR"
                                  ? "bg-sky-500"
                                  : "bg-emerald-500"
                              }`}>
                              {r.type === "DOCTOR" ? "A" : "D"}
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
                            <div className="mt-0.5 text-xs text-muted-foreground truncate">
                              {r.specialty}
                            </div>
                          ) : null}
                          {r.languages.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {r.languages.slice(0, 4).map((l) => (
                                <span
                                  key={l}
                                  className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
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
                          {r.address ? (
                            <div className="mt-1 text-xs text-muted-foreground truncate">
                              {r.address}
                            </div>
                          ) : null}
                        </div>
                        {canEdit ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(r);
                            }}>
                            Bearbeiten
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
      <div className="relative z-0 overflow-hidden rounded-lg border">
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
