"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench, AlertTriangle, Gauge, Battery, BatteryCharging, Droplet, Disc,
  Wind, Thermometer, Fuel, Lock, Truck, Zap, ScanLine,
} from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { ServiceCategory } from "@/lib/supabase/types";

const ICONS: Record<string, React.ElementType> = {
  engine: Gauge, tire: Disc, battery: Battery, "battery-full": BatteryCharging,
  droplet: Droplet, disc: Disc, wind: Wind, thermometer: Thermometer, fuel: Fuel,
  lock: Lock, truck: Truck, zap: Zap, scan: ScanLine, "alert-triangle": AlertTriangle,
};

export function ServicesGrid({ categories }: { categories: ServiceCategory[] }) {
  return (
    <section id="services" className="mx-auto w-full max-w-7xl px-4 py-16 md:py-20">
      <FadeInHeader />
      <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((c) => {
          const Icon = ICONS[c.icon ?? ""] ?? Wrench;
          return (
            <StaggerItem key={c.id}>
              <Link href={`/request?category=${c.slug}${c.is_emergency ? "&emergency=1" : ""}`} className="block h-full">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex h-full flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm transition-shadow hover:border-orange-300 hover:shadow-md"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                      c.is_emergency ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-neutral-800">{c.name}</span>
                </motion.div>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}

function FadeInHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-neutral-900">What do you need help with?</h2>
      <p className="mt-1 text-sm text-neutral-500">Pick a service and we&apos;ll find the right mechanic nearby.</p>
    </motion.div>
  );
}
