"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./map-view";

export type { MapMarker } from "./map-view";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-surface-2" />,
});

export function LiveMap(props: MapViewProps) {
  return <MapView {...props} />;
}
