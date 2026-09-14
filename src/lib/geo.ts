export type GeoPosition = { lat: number; lng: number };

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export async function reverseGeocode({ lat, lng }: GeoPosition): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error("Could not look up that location.");
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export type AddressResult = { label: string; lat: number; lng: number };

export async function searchAddress(query: string): Promise<AddressResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data as Array<{ display_name: string; lat: string; lon: string }>).map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export function haversineKm(a: GeoPosition, b: GeoPosition): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function etaMinutes(distanceKm: number, avgSpeedKmh = 30): number {
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}
