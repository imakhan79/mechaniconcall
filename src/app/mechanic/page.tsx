import { createClient } from "@/lib/supabase/server";
import { MechanicOverview } from "@/components/mechanic/mechanic-overview";
import type { Mechanic, Profile } from "@/lib/supabase/types";

export default async function MechanicOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mechanicId = user!.id;

  const [{ data: mechanic }, { data: assignedRequests }, { data: allRequests }, { data: earnings }] =
    await Promise.all([
      supabase.from("mechanics").select("*").eq("id", mechanicId).single(),
      supabase
        .from("service_requests")
        .select("*")
        .eq("mechanic_id", mechanicId)
        .eq("status", "MECHANIC_ASSIGNED"),
      supabase.from("service_requests").select("id, created_at").eq("mechanic_id", mechanicId),
      supabase.from("mechanic_earnings").select("net_amount, created_at").eq("mechanic_id", mechanicId),
    ]);

  const customerIds = [...new Set((assignedRequests ?? []).map((r) => r.customer_id))];
  const { data: customerProfiles } =
    customerIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", customerIds)
      : { data: [] as Profile[] };
  const profileById = new Map((customerProfiles ?? []).map((p) => [p.id, p]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayJobs = (allRequests ?? []).filter((r) => r.created_at.slice(0, 10) === todayStr).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekEarnings = (earnings ?? [])
    .filter((e) => new Date(e.created_at) >= weekAgo)
    .reduce((sum, e) => sum + Number(e.net_amount), 0);

  const normalizedAssigned = (assignedRequests ?? []).map((r) => ({
    ...r,
    customer_profile: profileById.get(r.customer_id) ?? null,
  }));

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Mechanic Dashboard</h1>
      <MechanicOverview
        mechanicId={mechanicId}
        mechanic={mechanic as Mechanic}
        assignedRequests={normalizedAssigned}
        todayJobs={todayJobs}
        weekEarnings={weekEarnings}
      />
    </div>
  );
}
