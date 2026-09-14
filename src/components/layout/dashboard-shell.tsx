"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wrench, X } from "lucide-react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

export function DashboardShell({
  role,
  fullName,
  navItems,
  cta,
  children,
}: {
  role: "customer" | "mechanic";
  fullName: string;
  navItems: NavItem[];
  cta?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Wrench className="h-5 w-5 text-brand-500" aria-hidden="true" /> Mechanic On Call
          </Link>
          <div className="hidden items-center gap-4 text-sm md:flex">
            <span className="text-muted-foreground">
              {fullName} <span className="text-border">·</span>{" "}
              <span className="capitalize text-muted-foreground/70">{role}</span>
            </span>
            {cta && (
              <Link
                href={cta.href}
                className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-background transition-colors hover:bg-brand-600"
              >
                {cta.label}
              </Link>
            )}
            <SignOutButton />
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

        <nav className="mx-auto hidden max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm md:flex">
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
                  active ? "text-brand-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {icon}
                {label}
                {active && (
                  <motion.span
                    layoutId={`${role}-nav-active`}
                    className="absolute inset-0 -z-10 rounded-lg bg-brand-500/10"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3 text-sm">
                <div className="mb-1 px-3 py-1 text-xs text-muted-foreground">
                  {fullName} · <span className="capitalize">{role}</span>
                </div>
                {navItems.map(({ href, label, icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium",
                        active ? "bg-brand-500/10 text-brand-400" : "text-foreground hover:bg-surface-2"
                      )}
                    >
                      {icon}
                      {label}
                    </Link>
                  );
                })}
                {cta && (
                  <Link
                    href={cta.href}
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-lg bg-brand-500 px-3 py-2.5 text-center font-medium text-background"
                  >
                    {cta.label}
                  </Link>
                )}
                <div className="mt-2 border-t border-border pt-2">
                  <SignOutButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
