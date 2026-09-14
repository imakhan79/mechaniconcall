"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Wrench, X, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { cn } from "@/lib/utils";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };

export function AdminHeader({ navItems }: { navItems: AdminNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-foreground">
          <Wrench className="h-5 w-5 text-brand-500" aria-hidden="true" /> Mechanic On Call Admin
        </Link>
        <div className="hidden md:block">
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
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors",
              pathname === href ? "bg-brand-500/10 text-brand-400" : "text-muted-foreground hover:bg-brand-500/10 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
          </Link>
        ))}
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
            <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto px-4 py-3 text-sm">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 font-medium",
                    pathname === href ? "bg-brand-500/10 text-brand-400" : "text-foreground hover:bg-surface-2"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border pt-2">
                <SignOutButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
