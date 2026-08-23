"use client";

import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 8, suffix: " min", label: "Avg. arrival time" },
  { value: 4.8, suffix: "★", label: "Average mechanic rating", decimals: 1 },
  { value: 24, prefix: "", suffix: "/7", label: "Emergency availability" },
  { value: 100, suffix: "%", label: "Transparent pricing" },
] as const;

export function TrustStats() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
        {STATS.map((s, i) => (
          <Counter key={s.label} {...s} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function Counter({
  value, suffix = "", prefix = "", decimals = 0, label, delay,
}: { value: number; suffix?: string; prefix?: string; decimals?: number; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, delay]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay }}>
      <div className="text-2xl font-bold text-neutral-900 tabular-nums">
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </div>
      <div className="text-sm text-neutral-500">{label}</div>
    </motion.div>
  );
}
