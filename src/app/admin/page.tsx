import { MapPin, Wrench, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { LiveMap } from "@/components/map/live-map";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export default async function AdminLiveMapPage() {
  const supabase = await createClient();

  const [{ data: mechanics }, { data: activeRequests }, { count: customerCount }] = await Promise.all([
    supabase.from("mechanics").select("id, business_name, current_lat, current_lng, is_online, rating_avg"),
    supabase
      .from("service_requests")
      .select("id, lat, lng, is_emergency, status, address")
      .not("status", "in", "(COMPLETED,PAID,CANCELLED)"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);

  const online = (mechanics ?? []).filter((m) => m.is_online);
  const emergencies = (activeRequests ?? []).filter((r) => r.is_emergency);
  const center: [number, number] = [24.8607, 67.0011];

  const markers = [
    ...online
      .filter((m) => m.current_lat && m.current_lng)
      .map((m) => ({
        id: `m-${m.id}`,
        lat: m.current_lat as number,
        lng: m.current_lng as number,
        icon: (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white ring-2 ring-white">
            <Wrench className="h-3.5 w-3.5" />
          </div>
        ),
        popup: `${m.business_name ?? "Mechanic"} · online`,
      })),
    ...(activeRequests ?? []).map((r) => ({
      id: `r-${r.id}`,
      lat: r.lat,
      lng: r.lng,
      icon: (
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white ring-2 ring-white ${r.is_emergency ? "bg-red-600" : "bg-blue-600"}`}>
          {r.is_emergency ? <AlertTriangle className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
        </div>
      ),
      popup: `${r.address ?? "Customer"} · ${r.status.replaceAll("_", " ")}`,
    })),
  ];

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Live Operations Map</h1>
        <Stagger className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Mechanics Online", online.length, false],
            ["Active Requests", (activeRequests ?? []).length, false],
            ["Emergencies", emergencies.length, emergencies.length > 0],
            ["Total Customers", customerCount ?? 0, false],
          ].map(([label, val, alert]) => (
            <StaggerItem key={String(label)}>
              <Card className={alert ? "border-red-300 bg-red-50" : undefined}>
                <CardContent className="flex items-center gap-2 py-3">
                  {alert && <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />}
                  <div>
                    <p className={`text-xl font-bold tabular-nums ${alert ? "text-red-700" : ""}`}>{val as number}</p>
                    <p className={`text-xs ${alert ? "text-red-600" : "text-neutral-500"}`}>{label as string}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <FadeIn className="flex-1" y={0}>
        <LiveMap center={center} zoom={12} radiusKm={10} markers={markers} className="h-full w-full" />
      </FadeIn>
    </div>
  );
}
