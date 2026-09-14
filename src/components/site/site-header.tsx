"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShieldCheck, Wrench, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/register", label: "For Mechanics" },
  { href: "/#safety", label: "Safety & Trust" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <Wrench className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold">Mechanic On Call</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Login
          </Link>
          <Link href="/request" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
            Get Help Now
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4 text-sm font-medium">
              <Link href="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-foreground hover:bg-surface-2">
                Home
              </Link>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-foreground hover:bg-surface-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-foreground hover:bg-surface-2">
                Login
              </Link>
              <Link
                href="/request"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: "primary" }), "mt-2 w-full")}
              >
                Get Help Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
