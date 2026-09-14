import { redirect } from "next/navigation";
import { Bell, Car, CreditCard, History, LayoutDashboard, LifeBuoy, MessageCircle, Star, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const iconClass = "h-4 w-4";
const navItems: NavItem[] = [
  { href: "/customer", label: "Overview", icon: <LayoutDashboard className={iconClass} aria-hidden="true" /> },
  { href: "/customer/vehicles", label: "Vehicles", icon: <Car className={iconClass} aria-hidden="true" /> },
  { href: "/customer/history", label: "Bookings", icon: <History className={iconClass} aria-hidden="true" /> },
  { href: "/customer/payments", label: "Payments", icon: <CreditCard className={iconClass} aria-hidden="true" /> },
  { href: "/customer/reviews", label: "Reviews", icon: <Star className={iconClass} aria-hidden="true" /> },
  { href: "/customer/messages", label: "Messages", icon: <MessageCircle className={iconClass} aria-hidden="true" /> },
  { href: "/customer/notifications", label: "Notifications", icon: <Bell className={iconClass} aria-hidden="true" /> },
  { href: "/customer/support", label: "Support", icon: <LifeBuoy className={iconClass} aria-hidden="true" /> },
  { href: "/customer/profile", label: "Profile", icon: <User className={iconClass} aria-hidden="true" /> },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login");
  if (profile.role !== "customer") redirect(profile.role === "mechanic" ? "/mechanic" : "/login");

  return (
    <DashboardShell role="customer" fullName={profile.full_name || "Customer"} navItems={navItems} cta={{ href: "/request", label: "Request a Mechanic" }}>
      {children}
    </DashboardShell>
  );
}
