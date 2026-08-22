"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, Home, ClipboardList, MessageCircle, User, LogOut, Map as MapIcon, Wallet, Users, ShieldCheck, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };

const NAV: Record<"customer" | "mechanic" | "admin", NavItem[]> = {
  customer: [
    { href: "/customer", label: "Overview", icon: Home },
    { href: "/customer/vehicles", label: "My Vehicles", icon: ClipboardList },
    { href: "/customer/history", label: "History", icon: ClipboardList },
    { href: "/customer/messages", label: "Messages", icon: MessageCircle },
    { href: "/customer/profile", label: "Profile", icon: User },
  ],
  mechanic: [
    { href: "/mechanic", label: "Dashboard", icon: Home },
    { href: "/mechanic/jobs", label: "Job History", icon: ClipboardList },
    { href: "/mechanic/earnings", label: "Earnings", icon: Wallet },
    { href: "/mechanic/profile", label: "Profile", icon: User },
  ],
  admin: [
    { href: "/admin", label: "Live Map", icon: MapIcon },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/mechanics", label: "Mechanics", icon: Wrench },
    { href: "/admin/requests", label: "Requests", icon: ClipboardList },
    { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ],
};

const MOBILE_NAV: Record<"customer" | "mechanic" | "admin", NavItem[]> = {
  customer: [
    { href: "/customer", label: "Home", icon: Home },
    { href: "/request", label: "Request", icon: ClipboardList },
    { href: "/customer/messages", label: "Messages", icon: MessageCircle },
    { href: "/customer/profile", label: "Profile", icon: User },
  ],
  mechanic: NAV.mechanic,
  admin: NAV.admin.slice(0, 4),
};

export function DashboardShell({
  role,
  fullName,
  children,
}: {
  role: "customer" | "mechanic" | "admin";
  fullName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV[role];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <Wrench className="h-5 w-5 text-orange-600" />
          <span className="font-bold">Mechanic On Call</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === href ? "bg-orange-50 text-orange-700" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-neutral-200 pt-3">
          <p className="truncate px-3 text-sm font-medium">{fullName}</p>
          <p className="px-3 text-xs capitalize text-neutral-400">{role}</p>
          <button onClick={signOut} className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-neutral-200 bg-white md:hidden">
        {MOBILE_NAV[role].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
              pathname === href ? "text-orange-600" : "text-neutral-400"
            )}
          >
            <Icon className="h-5 w-5" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
