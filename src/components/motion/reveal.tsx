"use client";

import { motion, useMotionValue, useSpring, useTransform, useInView, type Variants } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-3 w-3 ${className}`}>
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-brand-500"
        animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500" />
    </span>
  );
}

export function RouteLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 40" fill="none" className={className} aria-hidden="true">
      <motion.path
        d="M2 30 C 50 30, 60 10, 100 10 S 160 30, 198 12"
        stroke="var(--brand-500)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
      />
    </svg>
  );
}

export function AnimatedCounter({
  value,
  className = "",
  suffix = "",
}: {
  value: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: 1200, bounce: 0 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 12,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerContainer} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}
