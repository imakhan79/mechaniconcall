"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Phone, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveMap } from "@/components/map/live-map";
import { ChatPanel } from "@/components/chat/chat-panel";
import { cn } from "@/lib/utils";
import { haversineKm } from "@/lib/geo";
import { formatAED } from "@/lib/currency";
import type {
  EstimateItem,
  Mechanic,
  PaymentMethod,
  Profile,
  RepairEstimate,
  ServiceRequest,
} from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Request received",
  SEARCHING: "Finding a mechanic",
  MECHANIC_ASSIGNED: "Waiting for mechanic to accept",
  MECHANIC_ACCEPTED: "Mechanic is on the way",
  MECHANIC_ON_THE_WAY: "Mechanic is on the way",
  MECHANIC_ARRIVED: "Mechanic has arrived",
  INSPECTION: "Inspecting your vehicle",
  WAITING_FOR_APPROVAL: "Estimate ready for your approval",
  REPAIRING: "Repair in progress",
  COMPLETED: "Repair completed",
  PAYMENT_PENDING: "Awaiting payment",
  PAID: "Paid — all done",
  CANCELLED: "Cancelled",
};

const CANCELLABLE = new Set(["REQUESTED", "SEARCHING", "MECHANIC_ASSIGNED", "MECHANIC_ACCEPTED"]);

type NearbyMechanic = Mechanic & { profile: Profile | null; distanceKm: number };

export function TrackingView({
  customerId,
  initialRequest,
}: {
  customerId: string;
  initialRequest: ServiceRequest;
}) {
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [mechanicProfile, setMechanicProfile] = useState<(Mechanic & { profile: Profile | null }) | null>(null);
  const [nearby, setNearby] = useState<NearbyMechanic[]>([]);
  const [estimate, setEstimate] = useState<(RepairEstimate & { items: EstimateItem[] }) | null>(null);
  const [ratingGiven, setRatingGiven] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  // realtime subscription to this request's row
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Ensure the session (and therefore Realtime's auth token) is fully
    // loaded before subscribing — subscribing too early leaves the socket
    // unauthenticated, so RLS silently blocks every event on this channel.
    supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel(`request-${initialRequest.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "service_requests", filter: `id=eq.${initialRequest.id}` },
          (payload) => setRequest(payload.new as ServiceRequest)
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [initialRequest.id]);

  // load assigned mechanic's profile once mechanic_id is set
  useEffect(() => {
    async function loadMechanic() {
      if (!request.mechanic_id) {
        setMechanicProfile(null);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("mechanics")
        .select("*, profile:profiles(*)")
        .eq("id", request.mechanic_id)
        .maybeSingle();
      setMechanicProfile(data as unknown as Mechanic & { profile: Profile | null });
    }
    loadMechanic();
  }, [request.mechanic_id]);

  // while searching, load nearby online+verified mechanics
  useEffect(() => {
    if (request.status !== "SEARCHING" || request.mechanic_id) return;
    const supabase = createClient();
    supabase
      .from("mechanics")
      .select("*, profile:profiles(*)")
      .eq("is_online", true)
      .eq("verification_status", "verified")
      .not("current_lat", "is", null)
      .then(({ data }) => {
        const list = ((data ?? []) as unknown as (Mechanic & { profile: Profile | null })[])
          .map((m) => ({
            ...m,
            distanceKm: haversineKm({ lat: request.lat, lng: request.lng }, { lat: m.current_lat!, lng: m.current_lng! }),
          }))
          .filter((m) => m.distanceKm <= m.service_radius_km)
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 5);
        setNearby(list);
      });
  }, [request.status, request.mechanic_id, request.lat, request.lng]);

  // load estimate when waiting for approval
  useEffect(() => {
    async function loadEstimate() {
      if (request.status !== "WAITING_FOR_APPROVAL") {
        setEstimate(null);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("repair_estimates")
        .select("*, items:estimate_items(*)")
        .eq("request_id", request.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setEstimate(data as unknown as RepairEstimate & { items: EstimateItem[] });
    }
    loadEstimate();
  }, [request.status, request.id]);

  // check whether this request already has a rating
  useEffect(() => {
    if (request.status !== "PAID") return;
    const supabase = createClient();
    supabase
      .from("ratings")
      .select("id")
      .eq("request_id", request.id)
      .maybeSingle()
      .then(({ data }) => setRatingGiven(!!data));
  }, [request.status, request.id]);

  async function requestMechanic(mechanicId: string) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("service_requests")
      .update({ mechanic_id: mechanicId, status: "MECHANIC_ASSIGNED" })
      .eq("id", request.id);
    setBusy(false);
    if (error) toast.error("Could not reach that mechanic. Try another.");
    else toast.success("Request sent to mechanic");
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this request?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("service_requests")
      .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
      .eq("id", request.id);
    setBusy(false);
    if (error) toast.error("Could not cancel the request.");
  }

  async function respondToEstimate(approve: boolean) {
    if (!estimate) return;
    setBusy(true);
    const supabase = createClient();
    await supabase
      .from("repair_estimates")
      .update({ status: approve ? "approved" : "rejected" })
      .eq("id", estimate.id);
    await supabase
      .from("service_requests")
      .update({ status: approve ? "REPAIRING" : "INSPECTION" })
      .eq("id", request.id);
    setBusy(false);
    toast.success(approve ? "Estimate approved" : "Estimate rejected");
  }

  async function handleMarkPaid() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("payments").insert({
      request_id: request.id,
      method: paymentMethod,
      amount: request.final_price ?? request.estimated_price ?? 0,
    });
    if (!error) {
      await supabase.from("service_requests").update({ status: "PAID" }).eq("id", request.id);
    }
    setBusy(false);
    if (error) toast.error("Could not record payment.");
  }

  const mechanicMarker =
    mechanicProfile?.current_lat != null && mechanicProfile?.current_lng != null
      ? [{ id: "mechanic", lat: mechanicProfile.current_lat, lng: mechanicProfile.current_lng, label: mechanicProfile.business_name ?? "Mechanic", color: "#16a34a" }]
      : [];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-lg font-bold text-foreground">Request #{request.id}</h1>
            <Badge variant={request.status === "CANCELLED" ? "danger" : request.status === "PAID" ? "success" : "info"}>
              {STATUS_LABELS[request.status] ?? request.status}
            </Badge>
          </div>
          {request.address && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden="true" /> {request.address}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="h-56 overflow-hidden rounded-xl border border-border">
        <LiveMap
          center={{ lat: request.lat, lng: request.lng }}
          zoom={13}
          markers={[{ id: "customer", lat: request.lat, lng: request.lng, label: "You" }, ...mechanicMarker]}
        />
      </div>

      {request.status === "SEARCHING" && !request.mechanic_id && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Nearby Mechanics</h2>
            {nearby.length === 0 && <p className="text-sm text-muted-foreground">Looking for available mechanics nearby...</p>}
            <ul className="flex flex-col gap-2">
              {nearby.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.business_name || m.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.distanceKm.toFixed(1)} km away · ⭐ {m.rating_avg.toFixed(1)} ({m.rating_count})
                    </p>
                  </div>
                  <Button size="sm" variant="primary" disabled={busy} onClick={() => requestMechanic(m.id)}>
                    Request
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {mechanicProfile && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Your Mechanic</h2>
            <p className="text-sm text-foreground/80">{mechanicProfile.business_name || mechanicProfile.profile?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              ⭐ {mechanicProfile.rating_avg.toFixed(1)} ({mechanicProfile.rating_count} reviews)
            </p>
            {mechanicProfile.profile?.phone && (
              <a
                href={`tel:${mechanicProfile.profile.phone}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {mechanicProfile.profile.phone}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {estimate && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Repair Estimate</h2>
            <ul className="mb-2 flex flex-col divide-y divide-border text-sm">
              {estimate.items.map((item) => (
                <li key={item.id} className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-foreground">{formatAED(item.quantity * item.unit_price)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
              <span>Total</span>
              <span>{formatAED(estimate.grand_total)}</span>
            </div>
            {estimate.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => respondToEstimate(false)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button variant="primary" className="flex-1" disabled={busy} onClick={() => respondToEstimate(true)}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {request.status === "PAYMENT_PENDING" && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Payment</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Amount due: <span className="font-semibold text-foreground">{formatAED(request.final_price ?? request.estimated_price)}</span>
            </p>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mb-3 h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm capitalize text-foreground"
            >
              {(["cash", "card", "payit", "bank"] as PaymentMethod[]).map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m === "payit" ? "PayIt" : m}
                </option>
              ))}
            </select>
            <Button variant="primary" className="w-full" disabled={busy} onClick={handleMarkPaid}>
              Mark as Paid
            </Button>
          </CardContent>
        </Card>
      )}

      {request.status === "PAID" && !ratingGiven && (
        <RatingCard requestId={request.id} customerId={customerId} mechanicId={request.mechanic_id!} onDone={() => setRatingGiven(true)} />
      )}

      {request.mechanic_id && request.status !== "CANCELLED" && <ChatPanel requestId={request.id} userId={customerId} />}

      {CANCELLABLE.has(request.status) && (
        <Button variant="outline" disabled={busy} onClick={handleCancel} className="text-danger hover:bg-danger/10">
          Cancel Request
        </Button>
      )}

      <Button variant="ghost" onClick={() => router.push("/customer")}>
        Back to Dashboard
      </Button>
    </div>
  );
}

function RatingCard({
  requestId,
  customerId,
  mechanicId,
  onDone,
}: {
  requestId: number;
  customerId: string;
  mechanicId: string;
  onDone: () => void;
}) {
  const [overall, setOverall] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("ratings").insert({
      request_id: requestId,
      customer_id: customerId,
      mechanic_id: mechanicId,
      overall,
      review: review || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit rating.");
      return;
    }
    toast.success("Thanks for your feedback!");
    onDone();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Rate this mechanic</h2>
        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setOverall(n)} aria-label={`${n} stars`}>
              <Star className={cn("h-6 w-6", n <= overall ? "fill-warning text-warning" : "text-border")} />
            </button>
          ))}
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={2}
          placeholder="Leave a review (optional)"
          className="mb-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        />
        <Button variant="primary" className="w-full" disabled={submitting} onClick={handleSubmit}>
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}
