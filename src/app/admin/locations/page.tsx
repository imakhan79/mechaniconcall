import { MapPinned } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MechanicLocationRow = {
  id: string;
  business_name: string | null;
  is_online: boolean;
  service_radius_km: number;
  current_lat: number | null;
  current_lng: number | null;
  profile: { full_name: string } | null;
};

export default async function AdminLocationsPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, is_online, service_radius_km, current_lat, current_lng, profile:profiles(full_name)")
    .order("is_online", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
        <MapPinned className="h-5 w-5 text-brand-500" aria-hidden="true" /> Service Areas
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">Coverage radius for each mechanic based on their current location.</p>

      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-surface-2 text-left text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Mechanic</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Radius</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {((mechanics ?? []) as unknown as MechanicLocationRow[]).map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{m.business_name || m.profile?.full_name || "Mechanic"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.is_online ? "success" : "default"}>{m.is_online ? "Online" : "Offline"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.current_lat != null && m.current_lng != null
                      ? `${m.current_lat.toFixed(3)}, ${m.current_lng.toFixed(3)}`
                      : "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.service_radius_km} km</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!mechanics || mechanics.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No mechanics registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
