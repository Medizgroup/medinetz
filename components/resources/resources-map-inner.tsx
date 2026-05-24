"use client";

import * as React from "react";

import {
  Map,
  MapMarker,
  MapControls,
  MarkerContent,
  MarkerPopup,
  useMap,
  type MapViewport,
  MapRef,
} from "@/components/ui/map";

import type { ResourceRow } from "@/lib/types/resources";
import type { ResourcesMapProps } from "./resources-map";
import {
  Dollar,
  FolderOpen,
  Hospital,
  MapPoint,
  Phone,
  SmileSquare,
} from "@solar-icons/react-perf/category/style/LineDuotone";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Circle, CircleCheck, Clock, Loader } from "lucide-react";
import { STATUS_LABEL } from "@/lib/utils/cases";

const styles = {
  default: undefined,
  openstreetmap: "https://tiles.openfreemap.org/styles/bright",
  openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
};
type StyleKey = keyof typeof styles;

const FALLBACK_CENTER: [number, number] = [8.6766, 50.5854]; // Gießen [lng, lat]

/**
 * Berechnet Initial-Viewport: Mittelpunkt aller Pins, Fallback auf Gießen.
 */
function computeInitialViewport(
  resources: ResourceRow[],
): Partial<MapViewport> {
  const withCoords = resources.filter(
    (r) => r.latitude !== null && r.longitude !== null,
  );

  if (withCoords.length === 0) {
    return { center: FALLBACK_CENTER, zoom: 12 };
  }
  if (withCoords.length === 1) {
    const r = withCoords[0];
    return { center: [r.longitude!, r.latitude!], zoom: 14 };
  }

  const lats = withCoords.map((r) => r.latitude!);
  const lngs = withCoords.map((r) => r.longitude!);
  const center: [number, number] = [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  return { center, zoom: 15 };
}

/**
 * Innerer Helfer: Listener für Pin-Auswahl. Fliegt zum ausgewählten Marker.
 */
function FlyToSelected({
  resources,
  selectedId,
}: {
  resources: ResourceRow[];
  selectedId: string | null;
}) {
  const { map } = useMap();

  React.useEffect(() => {
    if (!map || !selectedId) return;
    const r = resources.find((x) => x.id === selectedId);
    if (!r || r.latitude === null || r.longitude === null) return;

    map.flyTo({
      center: [r.longitude, r.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 600,
    });
  }, [map, selectedId, resources]);

  return null;
}

/**
 * Initial-Bounds: bei Mount alle Pins ins Bild bringen.
 */
function FitBoundsOnMount({ resources }: { resources: ResourceRow[] }) {
  const { map, isLoaded } = useMap();
  const applied = React.useRef(false);

  React.useEffect(() => {
    if (!map || !isLoaded || applied.current) return;
    const withCoords = resources.filter(
      (r) => r.latitude !== null && r.longitude !== null,
    );
    if (withCoords.length < 2) {
      applied.current = true;
      return;
    }

    const lats = withCoords.map((r) => r.latitude!);
    const lngs = withCoords.map((r) => r.longitude!);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, duration: 0 },
    );
    applied.current = true;
  }, [map, isLoaded, resources]);

  return null;
}

export default function MapInner({
  resources,
  selectedId,
  onSelect,
}: ResourcesMapProps) {
  const withCoords = React.useMemo(
    () => resources.filter((r) => r.latitude !== null && r.longitude !== null),
    [resources],
  );

  const initialViewport = React.useMemo(
    () => computeInitialViewport(withCoords),
    // Nur beim ersten Mount berechnen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const mapRef = React.useRef<MapRef>(null);
  const [style, setStyle] = React.useState<StyleKey>("default");
  const selectedStyle = styles[style];
  const is3D = style === "openstreetmap3d";

  React.useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 });
  }, [is3D]);

  return (
    <Map
      viewport={initialViewport}
      onViewportChange={() => {}}
      zoom={initialViewport.zoom}
      minZoom={10}
      maxZoom={50}
      styles={
        selectedStyle
          ? { light: selectedStyle, dark: selectedStyle }
          : undefined
      }
      className="h-full w-full">
      <MapControls
        position="top-right"
        showZoom
        showCompass
        showLocate
        showFullscreen
      />
      <div className="absolute top-2 left-2 z-10">
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as StyleKey)}
          className="bg-background text-foreground rounded-md border px-2 py-1 text-sm shadow">
          <option value="default">Default</option>
          <option value="openstreetmap">OpenStreetMap</option>
          <option value="openstreetmap3d"> 3D</option>
        </select>
      </div>
      <FitBoundsOnMount resources={withCoords} />
      <FlyToSelected resources={withCoords} selectedId={selectedId} />

      {withCoords.map((r) => (
        <MapMarker
          key={r.id}
          longitude={r.longitude!}
          latitude={r.latitude!}
          onClick={() => onSelect(r)}>
          <MarkerContent>
            <Button
              size={selectedId === r.id ? "icon-xl" : "icon-sm"}
              type="button"
              variant="ghost"
              className={` bg-accent rounded-full transition-transform   ${
                r.type === "DOCTOR"
                  ? "text-white bg-blue-600 hover:bg-blue-500!"
                  : "text-white bg-pink-600 hover:bg-pink-500!"
              } ${
                selectedId === r.id
                  ? "ring ring-primary  scale-125"
                  : "scale-100"
              }`}>
              <Badge
                size="sm"
                className="absolute -top-1 -right-1 rounded-full px-1"
                aria-hidden="true">
                {r.type === "DOCTOR"
                  ? r.caseDoctors?.length
                  : r.caseInterpreters?.length}
              </Badge>
              {r.type === "DOCTOR" ? (
                <Hospital />
              ) : (
                <SmileSquare className="size-5" />
              )}
            </Button>
          </MarkerContent>

          <MarkerPopup closeButton className="min-w-64">
            <div className="space-y-1 text-sm">
              <div className="font-semibold">{r.name}</div>
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
                        r.caseDoctors && Array.isArray(r.caseDoctors)
                          ? r.caseDoctors
                              .filter(
                                (entry) =>
                                  entry.invoicePaid !== true &&
                                  entry.invoiceAmount != null,
                              )
                              .reduce(
                                (total, entry) =>
                                  total +
                                  (typeof entry.invoiceAmount === "number"
                                    ? entry.invoiceAmount
                                    : Number(entry.invoiceAmount) || 0),
                                0,
                              )
                          : 0;
                      return (
                        <span
                          className={cn(
                            sum === 0 ? "text-emerald-500" : "text-rose-500",
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
                              sum === 0 ? "text-emerald-500" : "text-rose-500",
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
                className={cn("py-4  divide-y max-h-40 overflow-y-auto grid")}>
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
                              ) : entry.case.status === "IN_PROGRESS" ? (
                                <Loader className="size-3  text-amber-500" />
                              ) : entry.case.status === "OPEN" ? (
                                <Circle className="size-3 text-green-500" />
                              ) : null}
                              {
                                STATUS_LABEL[
                                  entry.case.status as keyof typeof STATUS_LABEL
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
                              ) : entry.case.status === "IN_PROGRESS" ? (
                                <Loader className="size-3  text-amber-500" />
                              ) : entry.case.status === "OPEN" ? (
                                <Circle className="size-3 text-green-500" />
                              ) : null}
                              {
                                STATUS_LABEL[
                                  entry.case.status as keyof typeof STATUS_LABEL
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
          </MarkerPopup>
        </MapMarker>
      ))}
    </Map>
  );
}
