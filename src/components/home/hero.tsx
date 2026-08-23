"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, MapPin, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";

const EASE = [0.22, 1, 0.36, 1] as const;

interface MechanicMarker {
  id: string;
  business_name: string | null;
  current_lat: number | null;
  current_lng: number | null;
  rating_avg: number;
}

export function Hero({ mechanics }: { mechanics: MechanicMarker[] }) {
  const karachiCenter: [number, number] = [24.8607, 67.0011];

  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-28">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.span
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/15 px-3 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-600/30"
          >
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> 24/7 Roadside Assistance
          </motion.span>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
            className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl"
          >
            Need a Mechanic?
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              We&apos;re On the Way.
            </span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="mt-4 max-w-md text-lg text-neutral-300"
          >
            Get trusted roadside assistance wherever you are — live tracking, transparent
            pricing, verified mechanics.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/request">
              <Button variant="primary" size="lg" className="shadow-lg shadow-orange-600/25">
                <MapPin className="h-4 w-4" aria-hidden="true" /> Request a Mechanic
              </Button>
            </Link>
            <Link href="/mechanics">
              <Button variant="outline" size="lg" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Search className="h-4 w-4" aria-hidden="true" /> Find Nearby Mechanics
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}>
            <Link href="/request?emergency=1" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-400 transition-colors hover:text-red-300">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Emergency? Get help now
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
          className="h-72 overflow-hidden rounded-2xl ring-1 ring-white/10 md:h-[26rem]"
        >
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
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </div>
                ),
                popup: "You are here",
              },
              ...mechanics
                .filter((m) => m.current_lat && m.current_lng)
                .map((m) => ({
                  id: m.id,
                  lat: m.current_lat as number,
                  lng: m.current_lng as number,
                  icon: (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white shadow ring-2 ring-white">
                      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  ),
                  popup: `${m.business_name ?? "Mechanic"} · ⭐ ${Number(m.rating_avg).toFixed(1)}`,
                })),
            ]}
            className="h-full w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
