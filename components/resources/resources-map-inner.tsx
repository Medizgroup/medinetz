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
          <option value="default">Default (Carto)</option>
          <option value="openstreetmap">OpenStreetMap</option>
          <option value="openstreetmap3d">OpenStreetMap 3D</option>
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
            <button
              type="button"
              className={`flex size-6 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md transition-transform hover:scale-110 ${
                r.type === "DOCTOR" ? "bg-sky-500" : "bg-emerald-500"
              } ${
                selectedId === r.id ? "ring-2 ring-primary ring-offset-2" : ""
              }`}>
              {r.type === "DOCTOR" ? "A" : "D"}
            </button>
          </MarkerContent>

          <MarkerPopup closeButton>
            <div className="space-y-1 text-sm">
              <div className="font-semibold">{r.name}</div>
              {r.type === "DOCTOR" && r.specialty ? (
                <div className="text-xs text-muted-foreground">
                  {r.specialty}
                </div>
              ) : null}
              {r.type === "DOCTOR" && r.practiceName ? (
                <div className="text-xs">{r.practiceName}</div>
              ) : null}
              {r.languages.length > 0 ? (
                <div className="text-xs">
                  Sprachen: {r.languages.join(", ")}
                </div>
              ) : null}
              {r.address ? (
                <div className="text-xs text-muted-foreground">{r.address}</div>
              ) : null}
              {r.phone ? (
                <a
                  href={`tel:${r.phone}`}
                  className="block text-xs text-primary">
                  {r.phone}
                </a>
              ) : null}
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </Map>
  );
}
