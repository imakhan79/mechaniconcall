import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { LiveMap } from "@/components/map/live-map";
import type { MapMarker } from "@/components/map/live-map";

type OnlineMechanicRow = {
  id: string;
  business_name: string | null;
  current_lat: number;
  current_lng: number;
  profile: { full_name: string } | null;
};

export default async function AdminLiveOperationsPage() {
  const supabase = await createClient();

  const [{ data: mechanics }, { data: openRequests }] = await Promise.all([
    supabase
      .from("mechanics")
      .select("id, business_name, is_online, current_lat, current_lng, profile:profiles(full_name)")
      .eq("is_online", true)
      .not("current_lat", "is", null),
    supabase
      .from("service_requests")
      .select("id, lat, lng, status, is_emergency")
      .not("status", "in", "(PAID,CANCELLED)"),
  ]);

  const mechanicMarkers: MapMarker[] = ((mechanics ?? []) as unknown as OnlineMechanicRow[]).map((m) => ({
    id: `mechanic-${m.id}`,
    lat: m.current_lat,
    lng: m.current_lng,
    label: `${m.business_name || m.profile?.full_name || "Mechanic"} (online)`,
    color: "#8ed600",
  }));

  const requestMarkers: MapMarker[] = (openRequests ?? []).map((r) => ({
    id: `request-${r.id}`,
    lat: r.lat,
    lng: r.lng,
    label: `Booking #${r.id} — ${r.status.replace(/_/g, " ").toLowerCase()}`,
    color: r.is_emergency ? "#ef4444" : "#3b82f6",
  }));

  const allMarkers = [...mechanicMarkers, ...requestMarkers];
  const center = allMarkers[0] ? { lat: allMarkers[0].lat, lng: allMarkers[0].lng } : { lat: 25.2048, lng: 55.2708 };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
          <Radio className="h-5 w-5 text-brand-500" aria-hidden="true" /> Live Operations
        </h1>
        <p className="text-xs text-muted-foreground">Real mechanic GPS + open bookings — not simulated data.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-[480px] overflow-hidden rounded-xl border border-border">
            <LiveMap center={center} zoom={11} markers={allMarkers} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent>
              <p className="text-xs text-muted-foreground">Online Mechanics</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{mechanicMarkers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-muted-foreground">Open Bookings</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{requestMarkers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#8ed600" }} /> Online mechanic
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3b82f6" }} /> Open booking
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} /> Emergency booking
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
