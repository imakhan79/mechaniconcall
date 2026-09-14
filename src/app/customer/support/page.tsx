import { createClient } from "@/lib/supabase/server";
import { SupportDesk } from "@/components/support/support-desk";

export default async function CustomerSupportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Support</h1>
      <SupportDesk userId={user!.id} initialTickets={tickets ?? []} />
    </div>
  );
}
