import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("requested_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Service History</h1>
      <div className="mt-6 flex flex-col gap-3">
        {(requests ?? []).map((r) => (
          <Link key={r.id} href={`/track/${r.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{r.address}</p>
                  <p className="text-xs text-neutral-500">{new Date(r.requested_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {r.final_price != null && <span className="font-semibold">PKR {r.final_price}</span>}
                  <Badge variant={r.status === "CANCELLED" ? "danger" : ["COMPLETED", "PAID"].includes(r.status) ? "success" : "info"}>
                    {r.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(requests ?? []).length === 0 && <p className="text-sm text-neutral-400">No requests yet.</p>}
      </div>
    </div>
  );
}
