import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrackingView } from "@/components/request/tracking-view";

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/track/${id}`);

  const { data: request } = await supabase.from("service_requests").select("*").eq("id", id).single();
  if (!request) notFound();

  const { data: category } = request.category_id
    ? await supabase.from("service_categories").select("*").eq("id", request.category_id).single()
    : { data: null };

  let mechanic = null;
  let mechanicProfile = null;
  if (request.mechanic_id) {
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from("mechanics").select("*").eq("id", request.mechanic_id).single(),
      supabase.from("profiles").select("full_name, phone").eq("id", request.mechanic_id).single(),
    ]);
    mechanic = m;
    mechanicProfile = p;
  }

  return (
    <TrackingView
      request={request}
      category={category}
      mechanic={mechanic}
      mechanicProfile={mechanicProfile}
      currentUserId={user.id}
    />
  );
}
