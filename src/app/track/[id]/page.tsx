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

  const { data: request } = await supabase.from("service_requests").select("*").eq("id", id).maybeSingle();
  if (!request) notFound();

  return <TrackingView customerId={user.id} initialRequest={request} />;
}
