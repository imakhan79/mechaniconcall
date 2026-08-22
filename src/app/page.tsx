import Link from "next/link";
import {
  Wrench, MapPin, AlertTriangle, Gauge, Battery, BatteryCharging, Droplet, Disc,
  Wind, Thermometer, Fuel, Lock, Truck, Zap, ScanLine, Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { SiteHeader } from "@/components/layout/site-header";

const ICONS: Record<string, React.ElementType> = {
  engine: Gauge,
  tire: Disc,
  battery: Battery,
  "battery-full": BatteryCharging,
  droplet: Droplet,
  disc: Disc,
  wind: Wind,
  thermometer: Thermometer,
  fuel: Fuel,
  lock: Lock,
  truck: Truck,
  zap: Zap,
  scan: ScanLine,
  "alert-triangle": AlertTriangle,
};

export default async function Home() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("*")
    .order("sort_order");

  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, current_lat, current_lng, is_online, rating_avg")
    .eq("is_online", true)
    .limit(20);

  const karachiCenter: [number, number] = [24.8607, 67.0011];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/15 px-3 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-600/30">
              <Wrench className="h-3.5 w-3.5" /> 24/7 Roadside Assistance
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Need a Mechanic? We&apos;re On the Way.
            </h1>
            <p className="mt-4 max-w-md text-lg text-neutral-300">
              Get trusted roadside assistance wherever you are — live tracking, transparent
              pricing, verified mechanics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/request">
                <Button variant="primary" size="lg">
                  <MapPin className="h-4 w-4" /> Request a Mechanic
                </Button>
              </Link>
              <Link href="/mechanics">
                <Button variant="outline" size="lg" className="bg-white/5 text-white border-white/20 hover:bg-white/10">
                  <Search className="h-4 w-4" /> Find Nearby Mechanics
                </Button>
              </Link>
            </div>
            <Link href="/request?emergency=1" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300">
              <AlertTriangle className="h-4 w-4" /> Emergency? Get help now
            </Link>
          </div>

          <div className="h-72 overflow-hidden rounded-2xl ring-1 ring-white/10 md:h-96">
            <LiveMap
              center={karachiCenter}
              zoom={12}
              radiusKm={8}
              markers={[
                {
                  id: "me",
                  lat: karachiCenter[0],
                  lng: karachiCenter[1],
                  icon: (
                    <div className="pulse-marker relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                  ),
                  popup: "You are here",
                },
                ...(mechanics ?? [])
                  .filter((m) => m.current_lat && m.current_lng)
                  .map((m) => ({
                    id: m.id as string,
                    lat: m.current_lat as number,
                    lng: m.current_lng as number,
                    icon: (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white shadow ring-2 ring-white">
                        <Wrench className="h-3.5 w-3.5" />
                      </div>
                    ),
                    popup: `${m.business_name ?? "Mechanic"} · ⭐ ${Number(m.rating_avg).toFixed(1)}`,
                  })),
              ]}
              className="h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Quick services */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14">
        <h2 className="text-xl font-bold text-neutral-900">What do you need help with?</h2>
        <p className="mt-1 text-sm text-neutral-500">Pick a service and we&apos;ll find the right mechanic nearby.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(categories ?? []).map((c) => {
            const Icon = ICONS[c.icon ?? ""] ?? Wrench;
            return (
              <Link
                key={c.id}
                href={`/request?category=${c.slug}${c.is_emergency ? "&emergency=1" : ""}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center transition hover:border-orange-300 hover:shadow-md"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    c.is_emergency ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-neutral-800">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          {[
            ["8 min", "Avg. arrival time"],
            ["4.8★", "Average mechanic rating"],
            ["24/7", "Emergency availability"],
            ["100%", "Transparent pricing"],
          ].map(([stat, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-neutral-900">{stat}</div>
              <div className="text-sm text-neutral-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto bg-neutral-950 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call. Roadside help, wherever you are.
      </footer>
    </div>
  );
}
