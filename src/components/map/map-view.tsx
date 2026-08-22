"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  icon: ReactNode;
  popup?: ReactNode;
}

function toDivIcon(node: ReactNode, size = 36) {
  return L.divIcon({
    html: renderToStaticMarkup(<div>{node}</div>),
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function MapView({
  center,
  zoom = 14,
  markers = [],
  radiusKm,
  className,
}: {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  radiusKm?: number;
  className?: string;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {radiusKm ? (
        <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#ea580c", fillOpacity: 0.05 }} />
      ) : null}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={toDivIcon(m.icon)}>
          {m.popup ? <Popup>{m.popup}</Popup> : null}
        </Marker>
      ))}
    </MapContainer>
  );
}
