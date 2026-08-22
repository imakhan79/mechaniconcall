import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (profile.role === "mechanic") redirect("/mechanic");
  if (profile.role === "admin") redirect("/admin");

  return (
    <DashboardShell role="customer" fullName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
