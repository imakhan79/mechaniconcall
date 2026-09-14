import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function MechanicOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle();

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">
        Welcome, {profile?.full_name || "there"}
      </h1>
      <Card>
        <CardContent className="p-5 text-sm text-neutral-500">
          Incoming and assigned job requests will show up here.
        </CardContent>
      </Card>
    </div>
  );
}
