import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminMechanicsPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, is_online, rating_avg, rating_count, verification_status, trust_score")
    .order("rating_avg", { ascending: false });

  const ids = (mechanics ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Mechanics</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Trust Score</th>
            </tr>
          </thead>
          <tbody>
            {(mechanics ?? []).map((m) => {
              const p = profileMap.get(m.id);
              return (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p?.full_name ?? m.business_name}</p>
                    <p className="text-xs text-neutral-400">{m.business_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.is_online ? "success" : "outline"}>{m.is_online ? "Online" : "Offline"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.verification_status === "verified" ? "success" : m.verification_status === "rejected" || m.verification_status === "suspended" ? "danger" : "warning"}>
                      {m.verification_status.replaceAll("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{Number(m.rating_avg).toFixed(1)} ★ ({m.rating_count})</td>
                  <td className="px-4 py-3">{Number(m.trust_score).toFixed(0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(mechanics ?? []).length === 0 && <p className="p-4 text-sm text-neutral-400">No mechanics yet.</p>}
      </div>
    </div>
  );
}
