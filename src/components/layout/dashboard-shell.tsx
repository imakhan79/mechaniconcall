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
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-neutral-900">
            <Wrench className="h-5 w-5 text-sky-700" aria-hidden="true" /> Mechanic On Call
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-neutral-500 sm:inline">
              {fullName} <span className="text-neutral-300">·</span>{" "}
              <span className="capitalize text-neutral-400">{role}</span>
            </span>
            {cta && (
              <Link
                href={cta.href}
                className="rounded-lg bg-sky-700 px-3 py-1.5 font-medium text-white transition-colors hover:bg-sky-800"
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
                  active ? "text-sky-700" : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                {icon}
                {label}
                {active && (
                  <motion.span
                    layoutId={`${role}-nav-active`}
                    className="absolute inset-0 -z-10 rounded-lg bg-sky-50"
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
