import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function MechanicProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-heading text-xl font-bold text-neutral-900">Profile</h1>
      <ProfileForm userId={user!.id} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? null} />
      <Card>
        <CardContent className="p-5 text-sm text-neutral-500">
          Business details, specialties, and document verification are coming in the next phase.
        </CardContent>
      </Card>
    </div>
  );
}
