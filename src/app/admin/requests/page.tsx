import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("service_requests")
    .select("id, address, status, is_emergency, estimated_price, final_price, requested_at")
    .order("requested_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Service Requests</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Requested</th>
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/track/${r.id}`} className="font-medium hover:text-orange-600">
                    {r.is_emergency && "🚨 "}
                    {r.address}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.status === "CANCELLED" ? "danger" : ["PAID", "COMPLETED"].includes(r.status) ? "success" : "info"}>
                    {r.status.replaceAll("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">{r.final_price ?? r.estimated_price ? `PKR ${r.final_price ?? r.estimated_price}` : "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{new Date(r.requested_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(requests ?? []).length === 0 && <p className="p-4 text-sm text-neutral-400">No requests yet.</p>}
      </div>
    </div>
  );
}
