import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [{ count: customers }, { count: mechanics }, { data: requests }, { data: ratings }] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("mechanics").select("id", { count: "exact", head: true }),
    supabase.from("service_requests").select("status, is_emergency, final_price, requested_at, completed_at"),
    supabase.from("ratings").select("overall"),
  ]);

  const all = requests ?? [];
  const completed = all.filter((r) => ["COMPLETED", "PAID"].includes(r.status));
  const cancelled = all.filter((r) => r.status === "CANCELLED");
  const emergencies = all.filter((r) => r.is_emergency);
  const revenue = completed.reduce((s, r) => s + Number(r.final_price ?? 0), 0);
  const avgRating = ratings?.length ? ratings.reduce((s, r) => s + r.overall, 0) / ratings.length : 0;
  const cancellationRate = all.length ? (cancelled.length / all.length) * 100 : 0;

  const responseTimes = completed
    .filter((r) => r.completed_at)
    .map((r) => (new Date(r.completed_at!).getTime() - new Date(r.requested_at).getTime()) / 60000);
  const avgResponse = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

  const stats = [
    ["Total Customers", customers ?? 0],
    ["Active Mechanics", mechanics ?? 0],
    ["Total Requests", all.length],
    ["Emergency Requests", emergencies.length],
    ["Completed Jobs", completed.length],
    ["Revenue", `PKR ${revenue.toLocaleString()}`],
    ["Avg. Response Time", `${avgResponse.toFixed(0)} min`],
    ["Cancellation Rate", `${cancellationRate.toFixed(1)}%`],
    ["Customer Satisfaction", `${avgRating.toFixed(1)} ★`],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map(([label, val]) => (
          <Card key={label}>
            <CardContent className="py-5">
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
