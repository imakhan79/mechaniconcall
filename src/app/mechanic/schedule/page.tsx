import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UPCOMING_STATUSES = ["MECHANIC_ASSIGNED", "MECHANIC_ACCEPTED", "MECHANIC_ON_THE_WAY", "MECHANIC_ARRIVED"];

export default async function MechanicSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mechanic }, { data: upcoming }] = await Promise.all([
    supabase.from("mechanics").select("is_online, service_radius_km").eq("id", user!.id).single(),
    supabase
      .from("service_requests")
      .select("*")
      .eq("mechanic_id", user!.id)
      .in("status", UPCOMING_STATUSES)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Schedule</h1>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Availability</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {mechanic?.is_online ? "Online — Accepting Jobs" : "Offline — Not Accepting Jobs"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Service Radius</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{mechanic?.service_radius_km ?? 15} km</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-surface-2 p-4">
            <CalendarDays className="h-4 w-4 text-brand-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Upcoming Jobs</h2>
          </div>
          <div className="divide-y divide-surface-2">
            {(upcoming ?? []).map((r) => (
              <Link key={r.id} href={`/mechanic/job/${r.id}`} className="flex items-center justify-between p-4 hover:bg-surface-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Request #{r.id}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" aria-hidden="true" /> {r.address ?? `${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy, h:mm a")}</p>
                </div>
                <Badge variant="info">{r.status.replace(/_/g, " ").toLowerCase()}</Badge>
              </Link>
            ))}
            {(!upcoming || upcoming.length === 0) && (
              <p className="p-5 text-center text-sm text-muted-foreground">No upcoming jobs scheduled.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
