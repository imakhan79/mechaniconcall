import { createClient } from "@/lib/supabase/server";
import { VehiclesManager } from "@/components/customer/vehicles-manager";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">My Vehicles</h1>
      <VehiclesManager customerId={user.id} initialVehicles={vehicles ?? []} />
    </div>
  );
}
