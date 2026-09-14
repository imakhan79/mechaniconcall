import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { MechanicProfileForm } from "@/components/mechanic/mechanic-profile-form";
import type { Mechanic } from "@/lib/supabase/types";

export default async function MechanicProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mechanicId = user!.id;

  const [{ data: profile }, { data: mechanic }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", mechanicId).maybeSingle(),
    supabase.from("mechanics").select("*").eq("id", mechanicId).single(),
    supabase.from("mechanic_documents").select("*").eq("mechanic_id", mechanicId).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="font-heading text-xl font-bold text-foreground">Profile</h1>
      <ProfileForm userId={mechanicId} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? null} />
      <MechanicProfileForm mechanicId={mechanicId} mechanic={mechanic as Mechanic} documents={documents ?? []} />
    </div>
  );
}
