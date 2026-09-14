import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayoutButton } from "@/components/mechanic/payout-button";
import { formatAED } from "@/lib/currency";

export default async function MechanicEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mechanicId = user!.id;

  const [{ data: earnings }, { data: payouts }] = await Promise.all([
    supabase.from("mechanic_earnings").select("*").eq("mechanic_id", mechanicId).order("created_at", { ascending: false }),
    supabase.from("payouts").select("*").eq("mechanic_id", mechanicId).order("requested_at", { ascending: false }),
  ]);

  const grossTotal = (earnings ?? []).reduce((s, e) => s + Number(e.gross_amount), 0);
  const feeTotal = (earnings ?? []).reduce((s, e) => s + Number(e.platform_fee), 0);
  const netTotal = (earnings ?? []).reduce((s, e) => s + Number(e.net_amount), 0);
  const requestedTotal = (payouts ?? [])
    .filter((p) => p.status !== "rejected")
    .reduce((s, p) => s + Number(p.amount), 0);
  const available = Math.max(0, netTotal - requestedTotal);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl font-bold text-foreground">Earnings</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gross" value={grossTotal} />
        <Stat label="Platform Fee" value={feeTotal} />
        <Stat label="Net Earnings" value={netTotal} />
        <Stat label="Available" value={available} highlight />
      </div>

      <PayoutButton mechanicId={mechanicId} amount={available} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Payout History</h2>
        <Card>
          <CardContent className="divide-y divide-surface-2 p-0">
            {(payouts ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{formatAED(Number(p.amount))}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.requested_at), "d MMM yyyy")}</p>
                </div>
                <Badge variant={p.status === "paid" ? "success" : p.status === "rejected" ? "danger" : "warning"}>
                  {p.status}
                </Badge>
              </div>
            ))}
            {(!payouts || payouts.length === 0) && (
              <p className="p-5 text-center text-sm text-muted-foreground">No payout requests yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Completed Jobs</h2>
        <Card>
          <CardContent className="divide-y divide-surface-2 p-0">
            {(earnings ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Job #{e.request_id}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "d MMM yyyy")}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatAED(Number(e.net_amount))}</p>
              </div>
            ))}
            {(!earnings || earnings.length === 0) && (
              <p className="p-5 text-center text-sm text-muted-foreground">No completed jobs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className={`text-lg font-bold ${highlight ? "text-brand-500" : "text-foreground"}`}>{formatAED(value)}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
