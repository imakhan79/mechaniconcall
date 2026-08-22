import { createClient } from "@/lib/supabase/server";
import { VerificationQueue } from "@/components/admin/verification-queue";

export default async function AdminVerificationPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, verification_status")
    .in("verification_status", ["pending", "under_review"]);

  const ids = (mechanics ?? []).map((m) => m.id);
  const [{ data: profiles }, { data: documents }] = await Promise.all([
    ids.length ? supabase.from("profiles").select("id, full_name, phone").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("mechanic_documents").select("*").in("mechanic_id", ids) : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold">Mechanic Verification</h1>
      <VerificationQueue
        mechanics={mechanics ?? []}
        profiles={profiles ?? []}
        documents={documents ?? []}
      />
    </div>
  );
}
