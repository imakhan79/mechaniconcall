import { createClient } from "@/lib/supabase/server";
import { VerificationQueue, type PendingMechanic } from "@/components/admin/verification-queue";

export default async function AdminVerificationPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("*, profile:profiles(*), documents:mechanic_documents(*)")
    .in("verification_status", ["pending", "under_review"])
    .order("created_at", { ascending: true });

  const withSignedUrls: PendingMechanic[] = await Promise.all(
    (mechanics ?? []).map(async (m) => {
      const docs = (m.documents ?? []) as unknown as { id: string; mechanic_id: string; doc_type: string; file_url: string; status: string; created_at: string }[];
      const documents = await Promise.all(
        docs.map(async (d) => {
          const { data } = await supabase.storage.from("mechanic-documents").createSignedUrl(d.file_url, 3600);
          return { ...d, signedUrl: data?.signedUrl ?? null };
        })
      );
      return { ...(m as unknown as PendingMechanic), documents };
    })
  );

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Mechanic Verification</h1>
      <VerificationQueue mechanics={withSignedUrls} />
    </div>
  );
}
