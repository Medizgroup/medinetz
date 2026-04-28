"use client";

import MapInner from "./resources-map-inner";
import type { ResourceRow } from "@/lib/types/resources";

export type ResourcesMapProps = {
  resources: ResourceRow[];
  selectedId: string | null;
  onSelect: (resource: ResourceRow) => void;
};

export default function ResourcesMap(props: ResourcesMapProps) {
  return <MapInner {...props} />;
}
