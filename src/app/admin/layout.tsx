import { redirect } from "next/navigation";
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
import { AdminHeader } from "@/components/admin/admin-header";

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
      <AdminHeader navItems={navItems} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
