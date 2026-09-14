import Link from "next/link";
import { format } from "date-fns";
import { Car, CheckCircle2, Clock, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES = [
  "REQUESTED",
  "SEARCHING",
  "MECHANIC_ASSIGNED",
  "MECHANIC_ACCEPTED",
  "MECHANIC_ON_THE_WAY",
  "MECHANIC_ARRIVED",
  "INSPECTION",
  "WAITING_FOR_APPROVAL",
  "REPAIRING",
  "PAYMENT_PENDING",
];

export default async function CustomerOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: activeRequests }, { data: recentRequests }, { data: vehicles }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", userId)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_requests")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("vehicles").select("id").eq("customer_id", userId),
  ]);

  const totalRequests = recentRequests?.length ?? 0;
  const completedCount =
    recentRequests?.filter((r) => r.status === "PAID" || r.status === "COMPLETED").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl font-bold text-neutral-900">Welcome, {profile?.full_name || "there"}</h1>

      {activeRequests && activeRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeRequests.map((r) => (
            <Link
              key={r.id}
              href={`/track/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 p-4 transition-colors hover:bg-sky-100"
            >
              <div>
                <p className="text-sm font-semibold text-sky-900">Active request #{r.id}</p>
                <p className="text-xs text-sky-700">{r.status.replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <Badge variant="info">Track</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Wrench} label="Total Requests" value={totalRequests} />
        <StatTile icon={CheckCircle2} label="Completed" value={completedCount} />
        <StatTile icon={Car} label="Vehicles" value={vehicles?.length ?? 0} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Recent Activity</h2>
          <Link href="/customer/history" className="text-xs font-medium text-sky-700 hover:underline">
            View all
          </Link>
        </div>
        <Card>
          <CardContent className="divide-y divide-neutral-100 p-0">
            {(recentRequests ?? []).map((r) => (
              <Link key={r.id} href={`/track/${r.id}`} className="flex items-center justify-between p-4 hover:bg-neutral-50">
                <div>
                  <p className="text-sm font-medium text-neutral-900">Request #{r.id}</p>
                  <p className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="h-3 w-3" aria-hidden="true" /> {format(new Date(r.created_at), "d MMM yyyy")}
                  </p>
                </div>
                <Badge variant={r.status === "PAID" ? "success" : r.status === "CANCELLED" ? "danger" : "info"}>
                  {r.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </Link>
            ))}
            {(!recentRequests || recentRequests.length === 0) && (
              <p className="p-5 text-center text-sm text-neutral-400">
                No requests yet.{" "}
                <Link href="/request" className={cn(buttonVariants({ variant: "link", size: "sm" }))}>
                  Request a mechanic
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: number }) {
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
