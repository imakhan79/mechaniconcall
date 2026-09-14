import { createClient } from "@/lib/supabase/server";
import { VehiclesManager } from "@/components/customer/vehicles-manager";

export default async function CustomerVehiclesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Vehicles</h1>
      <VehiclesManager customerId={user!.id} vehicles={vehicles ?? []} />
    </div>
  );
}
