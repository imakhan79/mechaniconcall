import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/customer/profile-form";

export default async function CustomerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <ProfileForm email={user.email ?? ""} profile={profile!} />
    </div>
  );
}
