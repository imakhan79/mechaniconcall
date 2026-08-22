import { createClient } from "@/lib/supabase/server";
import { MechanicOverview } from "@/components/mechanic/mechanic-overview";

export default async function MechanicDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mechanic } = await supabase.from("mechanics").select("*").eq("id", user.id).single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: activeJob }, { data: todayJobs }, { data: earnings }] = await Promise.all([
    supabase
      .from("service_requests")
      .select("*")
      .eq("mechanic_id", user.id)
      .not("status", "in", "(COMPLETED,PAID,CANCELLED)")
      .order("requested_at", { ascending: false })
      .maybeSingle(),
    supabase.from("service_requests").select("id, status").eq("mechanic_id", user.id).gte("requested_at", today.toISOString()),
    supabase.from("mechanic_earnings").select("net_amount, created_at").eq("mechanic_id", user.id),
  ]);

  const todayEarnings = (earnings ?? [])
    .filter((e) => new Date(e.created_at) >= today)
    .reduce((sum, e) => sum + Number(e.net_amount), 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEarnings = (earnings ?? [])
    .filter((e) => new Date(e.created_at) >= weekAgo)
    .reduce((sum, e) => sum + Number(e.net_amount), 0);

  return (
    <MechanicOverview
      mechanicId={user.id}
      fullName={profile?.full_name ?? "Mechanic"}
      mechanic={mechanic}
      activeJob={activeJob}
      todayJobsCount={todayJobs?.length ?? 0}
      todayEarnings={todayEarnings}
      weekEarnings={weekEarnings}
    />
  );
}
