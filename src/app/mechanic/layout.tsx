import { redirect } from "next/navigation";
import { Bell, Briefcase, CalendarDays, FileCheck2, LayoutDashboard, LifeBuoy, Star, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const iconClass = "h-4 w-4";
const navItems: NavItem[] = [
  { href: "/mechanic", label: "Overview", icon: <LayoutDashboard className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/jobs", label: "Jobs", icon: <Briefcase className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/schedule", label: "Schedule", icon: <CalendarDays className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/earnings", label: "Earnings", icon: <Wallet className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/reviews", label: "Reviews", icon: <Star className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/documents", label: "Documents", icon: <FileCheck2 className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/notifications", label: "Notifications", icon: <Bell className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/support", label: "Support", icon: <LifeBuoy className={iconClass} aria-hidden="true" /> },
  { href: "/mechanic/profile", label: "Profile", icon: <User className={iconClass} aria-hidden="true" /> },
];

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mechanic");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login");
  if (profile.role !== "mechanic") redirect(profile.role === "customer" ? "/customer" : "/login");

  return (
    <DashboardShell role="mechanic" fullName={profile.full_name || "Mechanic"} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
