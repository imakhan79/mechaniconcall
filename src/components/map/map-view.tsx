"use client";

import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

export interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  radiusKm?: number;
  className?: string;
}

function makeIcon(color: string) {
  const html = renderToStaticMarkup(
    <div
      style={{
        background: color,
        width: 26,
        height: 26,
        borderRadius: "9999px",
        border: "2px solid white",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }}
    />
  );
  return L.divIcon({ html, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
}

export function MapView({ center, zoom = 13, markers = [], radiusKm, className }: MapViewProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className ?? "h-full w-full"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {radiusKm !== undefined && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#0369a1", fillOpacity: 0.05 }}
        />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={makeIcon(m.color ?? "#0369a1")}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
