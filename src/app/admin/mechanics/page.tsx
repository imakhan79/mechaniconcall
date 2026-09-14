import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminMechanicsPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase.from("mechanics").select("*, profile:profiles(*)").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Mechanics</h1>
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-sky-50/60 text-left text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(mechanics ?? []).map((m) => {
                const profile = m.profile as unknown as { full_name: string } | null;
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{profile?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{m.business_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.is_online ? "success" : "default"}>{m.is_online ? "Online" : "Offline"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={m.verification_status === "verified" ? "success" : m.verification_status === "rejected" || m.verification_status === "suspended" ? "danger" : "warning"}>
                        {m.verification_status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      ⭐ {Number(m.rating_avg).toFixed(1)} ({m.rating_count})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!mechanics || mechanics.length === 0) && (
            <p className="p-5 text-center text-sm text-neutral-400">No mechanics registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
