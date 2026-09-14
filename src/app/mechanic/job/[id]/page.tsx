import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobWorkspace } from "@/components/mechanic/job-workspace";

export default async function MechanicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request } = await supabase.from("service_requests").select("*").eq("id", id).maybeSingle();
  if (!request) notFound();

  const [{ data: customerProfile }, { data: vehicle }, { data: category }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", request.customer_id).maybeSingle(),
    request.vehicle_id ? supabase.from("vehicles").select("*").eq("id", request.vehicle_id).maybeSingle() : Promise.resolve({ data: null }),
    request.category_id ? supabase.from("service_categories").select("*").eq("id", request.category_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <JobWorkspace
      mechanicId={user!.id}
      initialRequest={request}
      customerProfile={customerProfile}
      vehicle={vehicle}
      category={category}
    />
  );
}
