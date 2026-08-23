"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Star, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPosition, haversineKm, etaMinutes } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Mechanic, ServiceRequest } from "@/lib/supabase/types";

interface OpenJob extends ServiceRequest {
  distanceKm?: number;
}

export function MechanicOverview({
  mechanicId, fullName, mechanic, activeJob, todayJobsCount, todayEarnings, weekEarnings,
}: {
  mechanicId: string;
  fullName: string;
  mechanic: Mechanic | null;
  activeJob: ServiceRequest | null;
  todayJobsCount: number;
  todayEarnings: number;
  weekEarnings: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [isOnline, setIsOnline] = useState(mechanic?.is_online ?? false);
  const [toggling, setToggling] = useState(false);
  const [assigned, setAssigned] = useState<OpenJob[]>([]);
  const [openJobs, setOpenJobs] = useState<OpenJob[]>([]);

  const loc = mechanic?.current_lat && mechanic?.current_lng ? { lat: mechanic.current_lat, lng: mechanic.current_lng } : null;

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from("service_requests").select("*").eq("mechanic_id", mechanicId).eq("status", "MECHANIC_ASSIGNED");
      setAssigned((a as OpenJob[]) ?? []);

      if (!isOnline || !loc) {
        setOpenJobs([]);
        return;
      }
      const { data: open } = await supabase.from("service_requests").select("*").eq("status", "SEARCHING").is("mechanic_id", null);
      const withDistance = ((open as OpenJob[]) ?? [])
        .map((r) => ({ ...r, distanceKm: haversineKm(loc, { lat: r.lat, lng: r.lng }) }))
        .filter((r) => r.distanceKm! <= (mechanic?.service_radius_km ?? 15))
        .sort((a, b) => a.distanceKm! - b.distanceKm!);
      setOpenJobs(withDistance);
    }
    load();

    const channel = supabase
      .channel(`mechanic-dash:${mechanicId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mechanicId, isOnline, loc?.lat, loc?.lng, supabase]);

  async function toggleOnline() {
    setToggling(true);
    try {
      const next = !isOnline;
      let lat = mechanic?.current_lat;
      let lng = mechanic?.current_lng;
      if (next) {
        const pos = await getCurrentPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      await supabase.from("mechanics").update({ is_online: next, current_lat: lat, current_lng: lng }).eq("id", mechanicId);
      if (lat && lng) {
        await supabase.from("mechanic_locations").upsert({ mechanic_id: mechanicId, lat, lng });
      }
      setIsOnline(next);
      toast.success(next ? "You're online" : "You're offline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setToggling(false);
    }
  }

  async function acceptAssigned(job: OpenJob) {
    await supabase.from("service_requests").update({ status: "MECHANIC_ACCEPTED", accepted_at: new Date().toISOString() }).eq("id", job.id);
    await supabase.from("service_request_status_history").insert({ request_id: job.id, status: "MECHANIC_ACCEPTED" });
    toast.success("Job accepted");
  }

  async function rejectAssigned(job: OpenJob) {
    const { error } = await supabase.from("service_requests").update({ mechanic_id: null, status: "SEARCHING" }).eq("id", job.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Job passed on");
  }

  async function grabOpenJob(job: OpenJob) {
    const { error } = await supabase
      .from("service_requests")
      .update({ mechanic_id: mechanicId, status: "MECHANIC_ACCEPTED", accepted_at: new Date().toISOString() })
      .eq("id", job.id)
      .is("mechanic_id", null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("service_request_status_history").insert({ request_id: job.id, status: "MECHANIC_ACCEPTED" });
    toast.success("Job accepted!");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good day, {fullName.split(" ")[0]}</h1>
          <p className="text-sm text-neutral-500">{mechanic?.business_name}</p>
        </div>
        <motion.button
          onClick={toggleOnline}
          disabled={toggling}
          whileTap={{ scale: 0.95 }}
          animate={{ backgroundColor: isOnline ? "#dcfce7" : "#e5e5e5" }}
          transition={{ duration: 0.25 }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${isOnline ? "text-green-700" : "text-neutral-600"}`}
        >
          <motion.span
            layout
            className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-600" : "bg-neutral-400"}`}
            animate={isOnline ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </motion.button>
      </div>

      <Stagger className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Today's Jobs", todayJobsCount],
          ["Today's Earnings", `PKR ${todayEarnings.toLocaleString()}`],
          ["Weekly Earnings", `PKR ${weekEarnings.toLocaleString()}`],
          ["Rating", `${(mechanic?.rating_avg ?? 0).toFixed(1)} ★`],
        ].map(([label, val]) => (
          <StaggerItem key={String(label)}>
            <Card>
              <CardContent className="py-4">
                <p className="text-xl font-bold tabular-nums">{val}</p>
                <p className="text-xs text-neutral-500">{label}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      {activeJob && (
        <FadeIn delay={0.1}>
          <Link href={`/mechanic/job/${activeJob.id}`}>
            <Card className="mt-6 border-2 border-orange-300 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {activeJob.is_emergency ? <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" /> : <MapPin className="h-7 w-7 text-orange-600" aria-hidden="true" />}
                  <div>
                    <p className="font-semibold">Active Job — {activeJob.status.replaceAll("_", " ")}</p>
                    <p className="text-sm text-neutral-500">{activeJob.address}</p>
                  </div>
                </div>
                <Button size="sm" variant="primary">Continue →</Button>
              </CardContent>
            </Card>
          </Link>
        </FadeIn>
      )}

      {assigned.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold">Requests Sent to You</h2>
          <Stagger className="mt-3 flex flex-col gap-2">
            {assigned.map((job) => (
              <StaggerItem key={job.id}>
                <Card>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{job.address}</p>
                      <p className="text-xs text-neutral-500">{job.description ?? "No description"}</p>
                    </div>
                    <div className="flex gap-2">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button size="sm" variant="outline" onClick={() => rejectAssigned(job)}>Reject</Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button size="sm" variant="primary" onClick={() => acceptAssigned(job)}>Accept</Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-semibold">Incoming Requests {isOnline ? "" : "(go online to see nearby jobs)"}</h2>
        <Stagger className="mt-3 flex flex-col gap-2">
          {openJobs.map((job) => (
            <StaggerItem key={job.id}>
              <Card>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{job.address}</p>
                    <p className="text-xs text-neutral-500">
                      {job.distanceKm?.toFixed(1)} km · ETA {etaMinutes(job.distanceKm ?? 0)} min
                      {job.estimated_price ? ` · ~PKR ${job.estimated_price}` : ""}
                    </p>
                  </div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button size="sm" variant="primary" onClick={() => grabOpenJob(job)}>Accept</Button>
                  </motion.div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
          {isOnline && openJobs.length === 0 && <p className="text-sm text-neutral-400">No open requests nearby right now.</p>}
        </Stagger>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-neutral-500">
        <Wallet className="h-4 w-4" />
        <Link href="/mechanic/earnings" className="hover:underline">View full earnings & payout history →</Link>
      </div>
    </div>
  );
}
