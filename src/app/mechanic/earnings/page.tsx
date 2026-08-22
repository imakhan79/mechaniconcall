import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function MechanicEarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: earnings }, { data: payouts }] = await Promise.all([
    supabase.from("mechanic_earnings").select("*").eq("mechanic_id", user.id).order("created_at", { ascending: false }),
    supabase.from("payouts").select("*").eq("mechanic_id", user.id).order("requested_at", { ascending: false }),
  ]);

  const totalNet = (earnings ?? []).reduce((s, e) => s + Number(e.net_amount), 0);
  const totalGross = (earnings ?? []).reduce((s, e) => s + Number(e.gross_amount), 0);
  const totalFees = (earnings ?? []).reduce((s, e) => s + Number(e.platform_fee), 0);
  const paidOut = (payouts ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayout = totalNet - paidOut;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Earnings</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Gross Revenue", totalGross],
          ["Platform Fee", totalFees],
          ["Net Earnings", totalNet],
          ["Pending Payout", pendingPayout],
        ].map(([label, val]) => (
          <Card key={String(label)}>
            <CardContent className="py-4">
              <p className="text-xl font-bold">PKR {Number(val).toLocaleString()}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 font-semibold">Completed Jobs</h2>
      <div className="mt-3 flex flex-col gap-2">
        {(earnings ?? []).map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center justify-between py-3 text-sm">
              <span className="text-neutral-500">{new Date(e.created_at).toLocaleDateString()}</span>
              <span>Gross PKR {Number(e.gross_amount).toLocaleString()}</span>
              <span>Fee PKR {Number(e.platform_fee).toLocaleString()}</span>
              <span className="font-semibold">Net PKR {Number(e.net_amount).toLocaleString()}</span>
            </CardContent>
          </Card>
        ))}
        {(earnings ?? []).length === 0 && <p className="text-sm text-neutral-400">No earnings yet.</p>}
      </div>
    </div>
  );
}
