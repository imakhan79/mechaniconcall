import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobWorkspace } from "@/components/mechanic/job-workspace";

export default async function MechanicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mechanic/job/${id}`);

  const { data: request } = await supabase.from("service_requests").select("*").eq("id", id).single();
  if (!request || request.mechanic_id !== user.id) notFound();

  const { data: category } = request.category_id
    ? await supabase.from("service_categories").select("*").eq("id", request.category_id).single()
    : { data: null };

  const { data: vehicle } = request.vehicle_id
    ? await supabase.from("vehicles").select("*").eq("id", request.vehicle_id).single()
    : { data: null };

  const { data: customerProfile } = await supabase.from("profiles").select("full_name, phone").eq("id", request.customer_id).single();

  return (
    <JobWorkspace
      request={request}
      category={category}
      vehicle={vehicle}
      customerProfile={customerProfile}
      mechanicId={user.id}
    />
  );
}
