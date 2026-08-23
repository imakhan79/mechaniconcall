import Link from "next/link";
import { AlertTriangle, Car, MapPin, Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABELS } from "@/components/request/status-timeline";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export default async function CustomerOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: active }, { data: vehicles }, { data: history }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", user.id)
      .not("status", "in", "(COMPLETED,PAID,CANCELLED)")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("vehicles").select("*").eq("customer_id", user.id),
    supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", user.id)
      .in("status", ["COMPLETED", "PAID"])
      .order("requested_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Overview</h1>
        <Link href="/request">
          <Button variant="primary"><Plus className="h-4 w-4" /> New Request</Button>
        </Link>
      </div>

      {active && (
        <FadeIn delay={0.05}>
          <Link href={`/track/${active.id}`}>
            <Card className={`mt-6 border-2 transition-shadow hover:shadow-md ${active.is_emergency ? "border-red-300" : "border-orange-300"}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {active.is_emergency ? <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" /> : <MapPin className="h-8 w-8 text-orange-600" aria-hidden="true" />}
                  <div>
                    <p className="font-semibold">Active Service — {STATUS_LABELS[active.status as keyof typeof STATUS_LABELS]}</p>
                    <p className="text-sm text-neutral-500">{active.address}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Track Live →</Button>
              </CardContent>
            </Card>
          </Link>
        </FadeIn>
      )}

      <Stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["My Vehicles", vehicles?.length ?? 0],
          ["Completed Jobs", history?.length ?? 0],
          ["Saved Locations", "—"],
          ["Support", "24/7"],
        ].map(([label, val]) => (
          <StaggerItem key={String(label)}>
            <Card>
              <CardContent className="py-4">
                <p className="text-2xl font-bold tabular-nums">{val}</p>
                <p className="text-xs text-neutral-500">{label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.1} className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">My Vehicles</h2>
          <Link href="/customer/vehicles" className="text-sm text-orange-600 hover:underline">Manage →</Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(vehicles ?? []).slice(0, 4).map((v) => (
            <Card key={v.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Car className="h-8 w-8 text-neutral-400" aria-hidden="true" />
                <div>
                  <p className="font-medium">{v.make} {v.model} {v.year ?? ""}</p>
                  <p className="text-xs text-neutral-500">{v.registration_number ?? "No plate"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {(vehicles ?? []).length === 0 && (
            <Link href="/customer/vehicles" className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 transition-colors hover:border-orange-300">
              + Add your first vehicle
            </Link>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.15} className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent Service History</h2>
          <Link href="/customer/history" className="text-sm text-orange-600 hover:underline">View all →</Link>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {(history ?? []).map((h) => (
            <Card key={h.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{h.address}</p>
                  <p className="text-xs text-neutral-500">{new Date(h.requested_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-neutral-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> {h.final_price ? `PKR ${h.final_price}` : "—"}
                </div>
              </CardContent>
            </Card>
          ))}
          {(history ?? []).length === 0 && <p className="text-sm text-neutral-400">No completed services yet.</p>}
        </div>
      </FadeIn>
    </div>
  );
}
