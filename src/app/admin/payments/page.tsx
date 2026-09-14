import { format } from "date-fns";
import { CreditCard, DollarSign, TrendingDown, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/currency";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const [{ data: payments }, { data: earnings }, { data: payouts }] = await Promise.all([
    supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("mechanic_earnings").select("gross_amount, platform_fee, net_amount"),
    supabase.from("payouts").select("amount, status"),
  ]);

  const grossRevenue = (payments ?? []).reduce((s, p) => s + (p.status === "completed" ? p.amount : 0), 0);
  const platformCommission = (earnings ?? []).reduce((s, e) => s + e.platform_fee, 0);
  const mechanicPayouts = (earnings ?? []).reduce((s, e) => s + e.net_amount, 0);
  const pendingPayouts = (payouts ?? []).filter((p) => p.status === "requested").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Payments & Revenue</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Gross Revenue" value={formatAED(grossRevenue)} />
        <Stat icon={TrendingDown} label="Platform Commission" value={formatAED(platformCommission)} />
        <Stat icon={Wallet} label="Mechanic Payouts" value={formatAED(mechanicPayouts)} />
        <Stat icon={CreditCard} label="Pending Payouts" value={formatAED(pendingPayouts)} />
      </div>

      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-surface-2 text-left text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-foreground">#{p.request_id}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.method === "payit" ? "PayIt" : p.method}</td>
                  <td className="px-4 py-3 text-foreground">{formatAED(p.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "completed" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(p.created_at), "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!payments || payments.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof DollarSign; label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
        <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
