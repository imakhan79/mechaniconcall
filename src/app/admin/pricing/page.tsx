import { createClient } from "@/lib/supabase/server";
import { PricingTable } from "@/components/admin/pricing-table";

export default async function AdminPricingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("service_categories").select("*").order("name");

  return (
    <div>
      <h1 className="mb-1 font-heading text-xl font-bold text-foreground">Services & Pricing</h1>
      <p className="mb-4 text-sm text-muted-foreground">Manage base pricing and emergency flags for each service category.</p>
      <PricingTable categories={categories ?? []} />
    </div>
  );
}
