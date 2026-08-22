import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MechanicJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: jobs } = await supabase
    .from("service_requests")
    .select("*")
    .eq("mechanic_id", user.id)
    .order("requested_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Job History</h1>
      <div className="mt-6 flex flex-col gap-3">
        {(jobs ?? []).map((j) => (
          <Link key={j.id} href={["COMPLETED", "PAYMENT_PENDING", "PAID", "CANCELLED"].includes(j.status) ? `/track/${j.id}` : `/mechanic/job/${j.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{j.address}</p>
                  <p className="text-xs text-neutral-500">{new Date(j.requested_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {j.final_price != null && <span className="font-semibold">PKR {j.final_price}</span>}
                  <Badge variant={j.status === "CANCELLED" ? "danger" : j.status === "PAID" ? "success" : "info"}>{j.status.replaceAll("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(jobs ?? []).length === 0 && <p className="text-sm text-neutral-400">No jobs yet.</p>}
      </div>
    </div>
  );
}
