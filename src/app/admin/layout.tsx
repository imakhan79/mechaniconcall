import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Car,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  Radio,
  ShieldCheck,
  Settings,
  Star,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/admin/sign-out-button";

const navItems = [
  { href: "/admin/requests", label: "Bookings", icon: Car },
  { href: "/admin/live", label: "Live Operations", icon: Radio },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/mechanics", label: "Mechanics", icon: Wrench },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/pricing", label: "Services & Pricing", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/locations", label: "Locations", icon: MapPinned },
  { href: "/admin", label: "Legacy Appointments", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
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
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-foreground">
            <Wrench className="h-5 w-5 text-brand-500" aria-hidden="true" /> Mechanic On Call Admin
          </Link>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-brand-500/10 hover:text-foreground"
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
