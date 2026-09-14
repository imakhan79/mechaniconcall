"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <Wrench className="h-5 w-5 text-brand-500" aria-hidden="true" /> Mechanic On Call
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
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
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
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
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
