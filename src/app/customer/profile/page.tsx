import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function CustomerProfilePage() {
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
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Profile</h1>
      <ProfileForm userId={user!.id} fullName={profile?.full_name ?? ""} phone={profile?.phone ?? null} />
    </div>
  );
}
