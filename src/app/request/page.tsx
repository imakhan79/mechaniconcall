import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestWizard } from "@/components/request/request-wizard";

export default async function RequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/request");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "customer") redirect("/");

  const [{ data: categories }, { data: vehicles }, { data: savedLocations }] = await Promise.all([
    supabase.from("service_categories").select("*").order("sort_order"),
    supabase.from("vehicles").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("saved_locations").select("*").eq("customer_id", user.id),
  ]);

  return (
    <RequestWizard
      categories={categories ?? []}
      vehicles={vehicles ?? []}
      savedLocations={savedLocations ?? []}
      customerId={user.id}
    />
  );
}
