import { AlertTriangle, CheckCircle2, DollarSign, Star, Users, Wrench, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    { count: customerCount },
    { count: mechanicCount },
    { data: requests },
    { data: invoices },
    { data: ratings },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "mechanic"),
    supabase.from("service_requests").select("status, is_emergency"),
    supabase.from("invoices").select("total"),
    supabase.from("ratings").select("overall"),
  ]);

  const totalRequests = requests?.length ?? 0;
  const completed = (requests ?? []).filter((r) => r.status === "PAID").length;
  const cancelled = (requests ?? []).filter((r) => r.status === "CANCELLED").length;
  const emergencies = (requests ?? []).filter((r) => r.is_emergency).length;
  const revenue = (invoices ?? []).reduce((sum, i) => sum + Number(i.total), 0);
  const avgRating = ratings && ratings.length > 0 ? ratings.reduce((s, r) => s + r.overall, 0) / ratings.length : 0;
  const cancellationRate = totalRequests > 0 ? (cancelled / totalRequests) * 100 : 0;

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Analytics</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Users} label="Customers" value={customerCount ?? 0} />
        <Stat icon={Wrench} label="Mechanics" value={mechanicCount ?? 0} />
        <Stat icon={CheckCircle2} label="Completed" value={completed} />
        <Stat icon={XCircle} label="Cancelled" value={`${cancellationRate.toFixed(0)}%`} />
        <Stat icon={AlertTriangle} label="Emergencies" value={emergencies} />
        <Stat icon={DollarSign} label="Revenue" value={`Rs ${revenue.toFixed(0)}`} />
        <Stat icon={Star} label="Avg Rating" value={avgRating.toFixed(1)} />
        <Stat icon={Wrench} label="Total Requests" value={totalRequests} />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <Icon className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <span className="text-lg font-bold text-neutral-900">{value}</span>
        <span className="text-xs text-neutral-500">{label}</span>
      </CardContent>
    </Card>
  );
}
