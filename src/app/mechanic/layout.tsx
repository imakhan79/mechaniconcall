import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function MechanicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mechanic");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.role === "customer") redirect("/customer");
  if (profile.role === "admin") redirect("/admin");

  return (
    <DashboardShell role="mechanic" fullName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
