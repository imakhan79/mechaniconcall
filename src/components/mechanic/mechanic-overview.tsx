"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, DollarSign, Power, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentPosition, haversineKm } from "@/lib/geo";
import { formatAED } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Mechanic, Profile, ServiceRequest } from "@/lib/supabase/types";

type OpenRequest = ServiceRequest & { distanceKm: number };
type AssignedRequest = ServiceRequest & { customer_profile: Profile | null };

export function MechanicOverview({
  mechanicId,
  mechanic,
  assignedRequests,
  todayJobs,
  weekEarnings,
}: {
  mechanicId: string;
  mechanic: Mechanic;
  assignedRequests: AssignedRequest[];
  todayJobs: number;
  weekEarnings: number;
}) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(mechanic.is_online);
  const [toggling, setToggling] = useState(false);
  const [openRequests, setOpenRequests] = useState<OpenRequest[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadOpenRequests() {
      if (!isOnline || mechanic.current_lat == null || mechanic.current_lng == null) {
        setOpenRequests([]);
        return;
      }
      const supabase = createClient();
      const origin = { lat: mechanic.current_lat, lng: mechanic.current_lng };
      const { data } = await supabase.from("service_requests").select("*").eq("status", "SEARCHING").is("mechanic_id", null);
      const list = ((data ?? []) as ServiceRequest[])
        .map((r) => ({ ...r, distanceKm: haversineKm(origin, { lat: r.lat, lng: r.lng }) }))
        .filter((r) => r.distanceKm <= mechanic.service_radius_km)
        .sort((a, b) => a.distanceKm - b.distanceKm);
      setOpenRequests(list);
    }
    loadOpenRequests();
  }, [isOnline, mechanic.current_lat, mechanic.current_lng, mechanic.service_radius_km]);

  async function handleToggleOnline() {
    setToggling(true);
    const supabase = createClient();

    if (!isOnline) {
      try {
        const pos = await getCurrentPosition();
        const { error } = await supabase
          .from("mechanics")
          .update({ is_online: true, current_lat: pos.lat, current_lng: pos.lng })
          .eq("id", mechanicId);
        if (error) toast.error("Could not go online.");
        else setIsOnline(true);
      } catch {
        toast.error("Could not get your location. Enable location access to go online.");
      }
    } else {
      const { error } = await supabase.from("mechanics").update({ is_online: false }).eq("id", mechanicId);
      if (error) toast.error("Could not go offline.");
      else setIsOnline(false);
    }
    setToggling(false);
    router.refresh();
  }

  async function handleClaim(requestId: number) {
    setBusy(true);
    const supabase = createClient();
    // RLS scopes this update to still-open rows (status='SEARCHING' AND
    // mechanic_id IS NULL); if another mechanic claimed it first, the row
    // no longer matches and PostgREST returns success with zero rows
    // rather than an error — .select().maybeSingle() is what lets us tell
    // the difference and avoid falsely reporting success.
    const { data, error } = await supabase
      .from("service_requests")
      .update({ mechanic_id: mechanicId, status: "MECHANIC_ACCEPTED", accepted_at: new Date().toISOString() })
      .eq("id", requestId)
      .select("id")
      .maybeSingle();
    setBusy(false);
    if (error || !data) {
      toast.error("Someone already claimed this job.");
      setOpenRequests((prev) => prev.filter((r) => r.id !== requestId));
      return;
    }
    toast.success("Job claimed");
    router.push(`/mechanic/job/${requestId}`);
  }

  async function handleRespond(requestId: number, accept: boolean) {
    setBusy(true);
    const supabase = createClient();
    if (accept) {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "MECHANIC_ACCEPTED", accepted_at: new Date().toISOString() })
        .eq("id", requestId);
      setBusy(false);
      if (error) toast.error("Could not accept the job.");
      else router.push(`/mechanic/job/${requestId}`);
    } else {
      const { error } = await supabase
        .from("service_requests")
        .update({ mechanic_id: null, status: "SEARCHING" })
        .eq("id", requestId);
      setBusy(false);
      if (error) toast.error("Could not reject the job.");
      else {
        toast.success("Job rejected");
        router.refresh();
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{isOnline ? "You're Online" : "You're Offline"}</p>
            <p className="text-xs text-muted-foreground">{isOnline ? "Visible to nearby customers" : "Go online to receive requests"}</p>
          </div>
          <Button
            variant={isOnline ? "accent" : "outline"}
            disabled={toggling}
            onClick={handleToggleOnline}
            className={cn(isOnline && "bg-success hover:bg-success")}
          >
            <Power className="h-4 w-4" aria-hidden="true" /> {isOnline ? "Online" : "Go Online"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Briefcase} label="Today's Jobs" value={todayJobs} />
        <StatTile icon={DollarSign} label="Week Earnings" value={formatAED(weekEarnings)} />
        <StatTile icon={Star} label="Rating" value={mechanic.rating_avg.toFixed(1)} />
      </div>

      {assignedRequests.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Requests Sent to You</h2>
          <ul className="flex flex-col gap-2">
            {assignedRequests.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-brand-500/10 p-4">
                <p className="text-sm font-medium text-foreground">
                  {r.customer_profile?.full_name || "Customer"} · Request #{r.id}
                </p>
                <p className="text-xs text-brand-500">{r.address}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => handleRespond(r.id, false)}>
                    Reject
                  </Button>
                  <Button size="sm" variant="primary" disabled={busy} onClick={() => handleRespond(r.id, true)}>
                    Accept
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOnline && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Incoming Requests Nearby</h2>
          {openRequests.length === 0 && <p className="text-sm text-muted-foreground">No open requests nearby right now.</p>}
          <ul className="flex flex-col gap-2">
            {openRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Request #{r.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.distanceKm.toFixed(1)} km away{r.is_emergency ? " · Emergency" : ""}
                  </p>
                </div>
                <Button size="sm" variant="primary" disabled={busy} onClick={() => handleClaim(r.id)}>
                  Claim
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
