import { createClient } from "@/lib/supabase/server";
import { MechanicProfileForm } from "@/components/mechanic/mechanic-profile-form";

export default async function MechanicProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: mechanic }, { data: documents }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("mechanics").select("*").eq("id", user.id).single(),
    supabase.from("mechanic_documents").select("*").eq("mechanic_id", user.id),
  ]);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Mechanic Profile</h1>
      <MechanicProfileForm
        email={user.email ?? ""}
        profile={profile!}
        mechanic={mechanic!}
        documents={documents ?? []}
      />
    </div>
  );
}
