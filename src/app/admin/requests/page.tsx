import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Service Requests</h1>
      <Card>
        <CardContent className="divide-y divide-neutral-100 p-0">
          {(requests ?? []).map((r) => (
            <Link key={r.id} href={`/track/${r.id}`} className="flex items-center justify-between p-4 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Request #{r.id} {r.is_emergency && <Badge variant="danger">Emergency</Badge>}
                </p>
                <p className="text-xs text-neutral-400">{format(new Date(r.created_at), "d MMM yyyy, h:mm a")}</p>
              </div>
              <Badge variant={r.status === "PAID" ? "success" : r.status === "CANCELLED" ? "danger" : "info"}>
                {r.status.replace(/_/g, " ").toLowerCase()}
              </Badge>
            </Link>
          ))}
          {(!requests || requests.length === 0) && (
            <p className="p-5 text-center text-sm text-neutral-400">No service requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
