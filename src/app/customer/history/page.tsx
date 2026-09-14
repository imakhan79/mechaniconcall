import Link from "next/link";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CustomerHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Service History</h1>
      <Card>
        <CardContent className="divide-y divide-neutral-100 p-0">
          {(requests ?? []).map((r) => (
            <Link key={r.id} href={`/track/${r.id}`} className="flex items-center justify-between p-4 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-medium text-neutral-900">Request #{r.id}</p>
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Clock className="h-3 w-3" aria-hidden="true" /> {format(new Date(r.created_at), "d MMM yyyy, h:mm a")}
                </p>
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
