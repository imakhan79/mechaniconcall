import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Car,
  LayoutDashboard,
  ShieldCheck,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/sign-out-button";

const navItems = [
  { href: "/admin", label: "Appointments", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/requests", label: "Requests", icon: Car },
  { href: "/admin/mechanics", label: "Mechanics", icon: Wrench },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: adminRow } = await supabase.from("workshop_admins").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50" suppressHydrationWarning>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-neutral-900">
            <Wrench className="h-5 w-5 text-sky-700" aria-hidden="true" /> Workshop Admin
          </Link>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-neutral-500 transition-colors hover:bg-sky-50 hover:text-neutral-900"
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
