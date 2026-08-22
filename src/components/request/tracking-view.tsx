"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wrench, Phone, MessageCircle, AlertTriangle, Star, X, CreditCard, Wallet, Smartphone, Landmark } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { haversineKm, etaMinutes } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { StatusTimeline } from "@/components/request/status-timeline";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { EstimateItem, Mechanic, PaymentMethod, RepairEstimate, ServiceCategory, ServiceRequest } from "@/lib/supabase/types";

interface Candidate extends Mechanic {
  distanceKm: number;
  etaMin: number;
}

export function TrackingView({
  request: initialRequest,
  category,
  mechanic: initialMechanic,
  mechanicProfile: initialMechanicProfile,
  currentUserId,
}: {
  request: ServiceRequest;
  category: ServiceCategory | null;
  mechanic: Mechanic | null;
  mechanicProfile: { full_name: string; phone: string | null } | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [request, setRequest] = useState(initialRequest);
  const [mechanic, setMechanic] = useState(initialMechanic);
  const [mechanicProfile, setMechanicProfile] = useState(initialMechanicProfile);
  const [mechanicLoc, setMechanicLoc] = useState<{ lat: number; lng: number } | null>(
    initialMechanic ? { lat: initialMechanic.current_lat ?? request.lat, lng: initialMechanic.current_lng ?? request.lng } : null
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);

  // realtime: request row updates
  useEffect(() => {
    const channel = supabase
      .channel(`request:${request.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests", filter: `id=eq.${request.id}` },
        async (payload) => {
          const updated = payload.new as ServiceRequest;
          setRequest(updated);
          if (updated.mechanic_id && updated.mechanic_id !== mechanic?.id) {
            const [{ data: m }, { data: p }] = await Promise.all([
              supabase.from("mechanics").select("*").eq("id", updated.mechanic_id).single(),
              supabase.from("profiles").select("full_name, phone").eq("id", updated.mechanic_id).single(),
            ]);
            setMechanic(m);
            setMechanicProfile(p);
            if (m) setMechanicLoc({ lat: m.current_lat ?? updated.lat, lng: m.current_lng ?? updated.lng });
          }
          if (updated.status === "PAID") setShowRating(true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, supabase]);

  // realtime: mechanic location updates
  useEffect(() => {
    if (!mechanic) return;
    const channel = supabase
      .channel(`mech-loc:${mechanic.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_locations", filter: `mechanic_id=eq.${mechanic.id}` },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          if (row) setMechanicLoc({ lat: row.lat, lng: row.lng });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mechanic, supabase]);

  // find nearby mechanics while searching
  useEffect(() => {
    if (request.status !== "SEARCHING" || request.mechanic_id) return;
    let active = true;
    supabase
      .from("mechanics")
      .select("*")
      .eq("is_online", true)
      .eq("verification_status", "verified")
      .then(({ data }) => {
        if (!active || !data) return;
        const ranked = (data as Mechanic[])
          .filter((m) => m.current_lat && m.current_lng)
          .map((m) => {
            const distanceKm = haversineKm({ lat: request.lat, lng: request.lng }, { lat: m.current_lat!, lng: m.current_lng! });
            return { ...m, distanceKm, etaMin: etaMinutes(distanceKm) };
          })
          .filter((m) => m.distanceKm <= m.service_radius_km)
          .sort((a, b) => a.distanceKm - b.distanceKm || b.rating_avg - a.rating_avg)
          .slice(0, 5);
        setCandidates(ranked);
      });
    return () => {
      active = false;
    };
  }, [request.status, request.mechanic_id, request.lat, request.lng, supabase]);

  async function requestMechanic(m: Candidate) {
    const { error } = await supabase
      .from("service_requests")
      .update({ mechanic_id: m.id, status: "MECHANIC_ASSIGNED" })
      .eq("id", request.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("service_request_status_history").insert({
      request_id: request.id,
      status: "MECHANIC_ASSIGNED",
      note: `Assigned to ${m.business_name ?? "mechanic"}`,
    });
    await supabase.from("notifications").insert({
      user_id: m.id,
      type: "new_request",
      title: "New service request nearby",
      body: `${m.distanceKm.toFixed(1)} km away`,
      data: { request_id: request.id },
    });
    toast.success(`Request sent to ${m.business_name ?? "mechanic"}`);
  }

  async function cancelRequest() {
    if (!confirm("Cancel this service request?")) return;
    await supabase
      .from("service_requests")
      .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
      .eq("id", request.id);
    toast.success("Request cancelled");
    router.push("/customer");
  }

  const distanceKm = mechanicLoc ? haversineKm({ lat: request.lat, lng: request.lng }, mechanicLoc) : null;
  const eta = distanceKm !== null ? etaMinutes(distanceKm) : null;

  const markers = [
    {
      id: "customer",
      lat: request.lat,
      lng: request.lng,
      icon: (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white">
          <MapPin className="h-4 w-4" />
        </div>
      ),
      popup: "You",
    },
    ...(mechanicLoc
      ? [
          {
            id: "mechanic",
            lat: mechanicLoc.lat,
            lng: mechanicLoc.lng,
            icon: (
              <div className="pulse-marker relative flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow-lg ring-2 ring-white">
                <Wrench className="h-4 w-4" />
              </div>
            ),
            popup: mechanicProfile?.full_name ?? "Mechanic",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {request.is_emergency && (
        <div className="flex items-center justify-center gap-2 bg-red-600 py-2 text-sm font-bold text-white">
          <AlertTriangle className="h-4 w-4" /> EMERGENCY REQUEST — Priority Dispatch Active
        </div>
      )}

      <div className="h-64 w-full sm:h-80">
        <LiveMap center={[request.lat, request.lng]} zoom={14} markers={markers} className="h-full w-full" />
      </div>

      <div className="mx-auto -mt-6 w-full max-w-3xl flex-1 px-4 pb-24">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">{category?.name ?? "Service Request"}</p>
              <p className="text-sm text-neutral-600">{request.address}</p>
            </div>
            {eta !== null && request.status !== "SEARCHING" && (
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{eta} min</p>
                <p className="text-xs text-neutral-400">{distanceKm?.toFixed(1)} km away</p>
              </div>
            )}
          </div>

          {mechanic && mechanicProfile && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold">
                  {mechanicProfile.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{mechanicProfile.full_name}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {mechanic.rating_avg.toFixed(1)} · {mechanic.business_name}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={mechanicProfile.phone ? `tel:${mechanicProfile.phone}` : undefined}>
                  <Button size="icon" variant="outline"><Phone className="h-4 w-4" /></Button>
                </a>
                <Button size="icon" variant="primary" onClick={() => setChatOpen(true)}><MessageCircle className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {request.status === "SEARCHING" && !request.mechanic_id && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-semibold">
                {candidates.length > 0 ? `${candidates.length} mechanics found nearby` : "Searching for nearby mechanics..."}
              </p>
              <div className="flex flex-col gap-2">
                {candidates.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
                    <div>
                      <p className="font-medium">{m.business_name ?? "Mechanic"}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {m.rating_avg.toFixed(1)} · {m.distanceKm.toFixed(1)} km · ETA {m.etaMin} min
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">{m.specialties.join(" • ")}</p>
                    </div>
                    <Button size="sm" variant="primary" onClick={() => requestMechanic(m)}>Request</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status === "WAITING_FOR_APPROVAL" && (
            <EstimateApproval requestId={request.id} onDecided={() => { /* realtime will update request */ }} />
          )}

          {request.status === "PAYMENT_PENDING" && (
            <PaymentPanel requestId={request.id} amount={request.final_price ?? 0} />
          )}

          <div className="mt-6">
            <StatusTimeline status={request.status} />
          </div>

          {!["COMPLETED", "PAID", "CANCELLED"].includes(request.status) && (
            <Button variant="outline" className="mt-2 w-full" onClick={cancelRequest}>
              Cancel Request
            </Button>
          )}
        </div>
      </div>

      {chatOpen && mechanic && (
        <ChatPanel requestId={request.id} currentUserId={currentUserId} onClose={() => setChatOpen(false)} />
      )}

      {showRating && (
        <RatingModal
          requestId={request.id}
          customerId={currentUserId}
          mechanicId={mechanic?.id ?? request.mechanic_id!}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

function RatingModal({
  requestId, customerId, mechanicId, onClose,
}: { requestId: string; customerId: string; mechanicId: string; onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [overall, setOverall] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const { error } = await supabase.from("ratings").insert({
      request_id: requestId, customer_id: customerId, mechanic_id: mechanicId, overall, review: review || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks for your feedback!");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">How was your service?</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-neutral-400" /></button>
        </div>
        <div className="mt-4 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setOverall(n)}>
              <Star className={`h-8 w-8 ${n <= overall ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />
            </button>
          ))}
        </div>
        <textarea
          className="mt-4 w-full rounded-lg border border-neutral-300 p-3 text-sm"
          placeholder="Optional review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />
        <Button variant="primary" className="mt-4 w-full" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Rating"}
        </Button>
      </div>
    </div>
  );
}

function EstimateApproval({ requestId, onDecided }: { requestId: string; onDecided: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [estimate, setEstimate] = useState<RepairEstimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("repair_estimates")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        setEstimate(data as RepairEstimate);
        const { data: its } = await supabase.from("estimate_items").select("*").eq("estimate_id", data.id);
        setItems((its as EstimateItem[]) ?? []);
      });
  }, [requestId, supabase]);

  async function decide(approve: boolean) {
    if (!estimate) return;
    setBusy(true);
    await supabase.from("repair_estimates").update({ status: approve ? "approved" : "rejected" }).eq("id", estimate.id);
    await supabase.from("service_requests").update({ status: approve ? "REPAIRING" : "INSPECTION" }).eq("id", requestId);
    await supabase.from("service_request_status_history").insert({ request_id: requestId, status: approve ? "REPAIRING" : "INSPECTION", note: approve ? "Customer approved estimate" : "Customer rejected estimate" });
    setBusy(false);
    onDecided();
  }

  if (!estimate) {
    return <p className="mt-5 text-sm text-neutral-400">Loading estimate...</p>;
  }

  return (
    <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
      <p className="font-semibold">Repair Estimate — Approval Needed</p>
      <dl className="mt-3 flex flex-col gap-1 text-sm">
        {items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <dt className="text-neutral-600">{it.name} ({it.kind}) × {it.quantity}</dt>
            <dd>PKR {it.total.toLocaleString()}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-orange-200 pt-1 text-neutral-600">
          <dt>Service fee</dt><dd>PKR {estimate.service_fee.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between text-neutral-600">
          <dt>Tax</dt><dd>PKR {estimate.tax_total.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between border-t border-orange-300 pt-1 font-bold text-neutral-900">
          <dt>Total</dt><dd>PKR {estimate.grand_total.toLocaleString()}</dd>
        </div>
      </dl>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => decide(false)} disabled={busy}>Reject</Button>
        <Button variant="primary" className="flex-1" onClick={() => decide(true)} disabled={busy}>Approve</Button>
      </div>
    </div>
  );
}

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { method: "cash", label: "Cash", icon: Wallet },
  { method: "card", label: "Card", icon: CreditCard },
  { method: "jazzcash", label: "JazzCash", icon: Smartphone },
  { method: "easypaisa", label: "Easypaisa", icon: Smartphone },
  { method: "bank_transfer", label: "Bank Transfer", icon: Landmark },
];

function PaymentPanel({ requestId, amount }: { requestId: string; amount: number }) {
  const supabase = useMemo(() => createClient(), []);
  const [paying, setPaying] = useState<PaymentMethod | null>(null);

  async function pay(method: PaymentMethod) {
    setPaying(method);
    const { data: invoice } = await supabase.from("invoices").select("id").eq("request_id", requestId).order("issued_at", { ascending: false }).limit(1).single();
    await supabase.from("payments").insert({ invoice_id: invoice?.id ?? null, request_id: requestId, method, status: "paid", amount });
    if (invoice) await supabase.from("invoices").update({ payment_method: method }).eq("id", invoice.id);
    await supabase.from("service_requests").update({ status: "PAID" }).eq("id", requestId);
    await supabase.from("service_request_status_history").insert({ request_id: requestId, status: "PAID" });
    toast.success("Payment recorded — thank you!");
    setPaying(null);
  }

  return (
    <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
      <p className="font-semibold">Amount due: PKR {amount.toLocaleString()}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Provider abstraction — cash confirms instantly here; card/JazzCash/Easypaisa/bank routes are wired to swap in a real gateway without touching this UI.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_METHODS.map(({ method, label, icon: Icon }) => (
          <button
            key={method}
            onClick={() => pay(method)}
            disabled={paying !== null}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2.5 text-sm font-medium hover:border-orange-300 disabled:opacity-50"
          >
            <Icon className="h-4 w-4" /> {paying === method ? "Processing..." : label}
          </button>
        ))}
      </div>
    </div>
  );
}
