import { createClient } from "@/lib/supabase/server";
import { SupportQueue } from "@/components/admin/support-queue";

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, user:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(150);

  const withNames = (tickets ?? []).map((t: any) => ({ ...t, user_name: t.user?.full_name ?? "Unknown" }));

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Support Tickets</h1>
      <SupportQueue tickets={withNames} />
    </div>
  );
}
