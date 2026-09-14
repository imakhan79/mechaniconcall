import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestWizard } from "@/components/request/request-wizard";

export default async function RequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/request");

  const [{ data: vehicles }, { data: categories }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("service_categories").select("*").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-center font-heading text-xl font-bold text-foreground">Request a Mechanic</h1>
      <RequestWizard customerId={user.id} vehicles={vehicles ?? []} categories={categories ?? []} />
    </div>
  );
}
