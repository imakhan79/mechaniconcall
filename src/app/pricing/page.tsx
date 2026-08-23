import Link from "next/link";
import {
  Gauge, Disc, Battery, BatteryCharging, Droplet, Wind, Thermometer, Fuel,
  Lock, Truck, Zap, ScanLine, AlertTriangle, Wrench, MapPin, Moon, Receipt,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata = { title: "Pricing | Mechanic On Call" };

const ICONS: Record<string, React.ElementType> = {
  engine: Gauge, tire: Disc, battery: Battery, "battery-full": BatteryCharging,
  droplet: Droplet, disc: Disc, wind: Wind, thermometer: Thermometer, fuel: Fuel,
  lock: Lock, truck: Truck, zap: Zap, scan: ScanLine, "alert-triangle": AlertTriangle,
};

const FACTORS = [
  { icon: MapPin, title: "Distance", desc: "A small per-km fee applies once the mechanic is dispatched to your location." },
  { icon: AlertTriangle, title: "Emergency surcharge", desc: "Marking a request as emergency adds a 25% priority-dispatch surcharge." },
  { icon: Moon, title: "Night surcharge", desc: "Requests between 10pm–6am may include a night-service surcharge." },
  { icon: Receipt, title: "Parts & labor", desc: "Any parts or extra labor are itemized in your estimate — you approve before work starts." },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <FadeIn>
            <h1 className="text-3xl font-bold md:text-5xl">Transparent, Upfront Pricing</h1>
            <p className="mx-auto mt-3 max-w-xl text-neutral-300">
              See a service fee before you request. No hidden charges — every repair estimate is itemized and needs your approval before work begins.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <FadeIn>
          <h2 className="text-xl font-bold text-neutral-900">Starting service fees</h2>
          <p className="mt-1 text-sm text-neutral-500">Base call-out fee by service — parts and extra labor are quoted separately after inspection.</p>
        </FadeIn>
        <Stagger className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c) => {
            const Icon = ICONS[c.icon ?? ""] ?? Wrench;
            return (
              <StaggerItem key={c.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${c.is_emergency ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-medium text-neutral-800">{c.name}</span>
                    </div>
                    <span className="font-bold tabular-nums text-neutral-900">
                      {c.base_price > 0 ? `PKR ${c.base_price.toLocaleString()}` : "Quoted on-site"}
                    </span>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <FadeIn>
            <h2 className="text-xl font-bold text-neutral-900">What affects your final price?</h2>
          </FadeIn>
          <Stagger className="mt-6 grid gap-4 sm:grid-cols-2">
            {FACTORS.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-neutral-800">{title}</p>
                    <p className="text-sm text-neutral-500">{desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
        <FadeIn>
          <h2 className="text-xl font-bold text-neutral-900">Ready to get help?</h2>
          <p className="mt-2 text-sm text-neutral-500">See your exact estimate in under a minute.</p>
          <Link href="/request">
            <Button variant="primary" size="lg" className="mt-5">Request a Mechanic</Button>
          </Link>
        </FadeIn>
      </section>

      <footer className="mt-auto bg-neutral-950 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call. Roadside help, wherever you are.
      </footer>
    </div>
  );
}
