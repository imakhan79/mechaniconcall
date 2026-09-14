import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/currency";

export default async function CustomerPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase.from("service_requests").select("id").eq("customer_id", user!.id);
  const requestIds = (requests ?? []).map((r) => r.id);

  const { data: payments } = requestIds.length
    ? await supabase
        .from("payments")
        .select("*")
        .in("request_id", requestIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const total = (payments ?? []).reduce((sum, p) => sum + (p.status === "completed" ? p.amount : 0), 0);

  return (
    <div>
      <h1 className="mb-1 font-heading text-xl font-bold text-foreground">Payments</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Total paid: <span className="font-semibold text-foreground">{formatAED(total)}</span>
      </p>
      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {(payments ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Request #{p.request_id} · <span className="capitalize">{p.method === "payit" ? "PayIt" : p.method}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "d MMM yyyy, h:mm a")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">{formatAED(p.amount)}</span>
                <Badge variant={p.status === "completed" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                  {p.status}
                </Badge>
              </div>
            </div>
          ))}
          {(!payments || payments.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No payments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
