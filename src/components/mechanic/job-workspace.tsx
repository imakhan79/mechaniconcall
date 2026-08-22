"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Navigation, Phone, MessageCircle, CheckCircle2, Plus, Trash2, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPosition } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { LiveMap } from "@/components/map/live-map";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { RequestStatus, ServiceCategory, ServiceRequest, Vehicle } from "@/lib/supabase/types";

const CHECKLIST: Record<string, string[]> = {
  Engine: ["Engine oil", "Coolant", "Belts", "Battery", "Electrical", "Engine warning light"],
  Brakes: ["Brake pads", "Brake fluid", "Brake discs"],
  Tires: ["Tire pressure", "Tire condition", "Spare tire"],
};

type EstimateLine = { kind: "labor" | "part"; name: string; quantity: number; unit_price: number };

export function JobWorkspace({
  request: initialRequest, category, vehicle, customerProfile, mechanicId,
}: {
  request: ServiceRequest;
  category: ServiceCategory | null;
  vehicle: Vehicle | null;
  customerProfile: { full_name: string; phone: string | null } | null;
  mechanicId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [request, setRequest] = useState(initialRequest);
  const [chatOpen, setChatOpen] = useState(false);
  const watchId = useRef<number | null>(null);

  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<EstimateLine[]>([{ kind: "labor", name: "Labor charges", quantity: 1, unit_price: category?.base_price ?? 1000 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`job:${request.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests", filter: `id=eq.${request.id}` }, (payload) => {
        setRequest(payload.new as ServiceRequest);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  async function updateStatus(status: RequestStatus, extra: Record<string, unknown> = {}) {
    const { error } = await supabase.from("service_requests").update({ status, ...extra }).eq("id", request.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    await supabase.from("service_request_status_history").insert({ request_id: request.id, status });
    setRequest((r) => ({ ...r, status, ...extra }) as ServiceRequest);
    return true;
  }

  async function startNavigation() {
    await updateStatus("MECHANIC_ON_THE_WAY");
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng, heading } = pos.coords;
          await supabase.from("mechanic_locations").upsert({ mechanic_id: mechanicId, request_id: request.id, lat, lng, heading: heading ?? null });
          await supabase.from("mechanics").update({ current_lat: lat, current_lng: lng }).eq("id", mechanicId);
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
    toast.success("Navigation started — sharing live location");
  }

  async function markArrived() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    await updateStatus("MECHANIC_ARRIVED", { arrived_at: new Date().toISOString() });
  }

  async function beginInspection() {
    await updateStatus("INSPECTION");
  }

  async function submitInspectionAndEstimate() {
    setSaving(true);
    try {
      const { data: inspection, error: insErr } = await supabase
        .from("inspections")
        .insert({ request_id: request.id, mechanic_id: mechanicId, notes: notes || null })
        .select("id")
        .single();
      if (insErr) throw insErr;

      const items = Object.entries(CHECKLIST).flatMap(([category, list]) =>
        list.map((item) => ({
          inspection_id: inspection.id,
          category,
          item,
          is_ok: checks[`${category}:${item}`] ?? true,
        }))
      );
      if (items.length) {
        const { error } = await supabase.from("inspection_items").insert(items);
        if (error) throw error;
      }

      const laborTotal = lines.filter((l) => l.kind === "labor").reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const partsTotal = lines.filter((l) => l.kind === "part").reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const serviceFee = category?.base_price ?? 0;
      const taxTotal = Math.round((laborTotal + partsTotal) * 0.05);
      const grandTotal = laborTotal + partsTotal + serviceFee + taxTotal;

      const { data: estimate, error: estErr } = await supabase
        .from("repair_estimates")
        .insert({
          request_id: request.id, labor_total: laborTotal, parts_total: partsTotal,
          service_fee: serviceFee, tax_total: taxTotal, grand_total: grandTotal, status: "pending",
        })
        .select("id")
        .single();
      if (estErr) throw estErr;

      await supabase.from("estimate_items").insert(
        lines.map((l) => ({ estimate_id: estimate.id, kind: l.kind, name: l.name, quantity: l.quantity, unit_price: l.unit_price, total: l.quantity * l.unit_price }))
      );

      await updateStatus("WAITING_FOR_APPROVAL");
      toast.success("Estimate sent to customer for approval");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit estimate");
    } finally {
      setSaving(false);
    }
  }

  async function completeJob() {
    setSaving(true);
    try {
      const { data: estimate } = await supabase.from("repair_estimates").select("*").eq("request_id", request.id).order("created_at", { ascending: false }).limit(1).single();
      const total = estimate?.grand_total ?? category?.base_price ?? 0;

      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber, request_id: request.id, customer_id: request.customer_id,
          mechanic_id: mechanicId, subtotal: total, tax: 0, discount: 0, total,
        })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("invoice_items").insert({ invoice_id: invoice.id, description: category?.name ?? "Service", quantity: 1, unit_price: total, total });

      const platformFee = Math.round(total * 0.15);
      await supabase.from("mechanic_earnings").insert({ mechanic_id: mechanicId, request_id: request.id, gross_amount: total, platform_fee: platformFee, net_amount: total - platformFee });

      await updateStatus("PAYMENT_PENDING", { final_price: total, completed_at: new Date().toISOString() });
      toast.success("Job marked complete — invoice generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete job");
    } finally {
      setSaving(false);
    }
  }

  const loc = { lat: request.lat, lng: request.lng };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-28">
      <button onClick={() => router.push("/mechanic")} className="text-sm text-neutral-500 hover:text-neutral-800">← Dashboard</button>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{category?.name ?? "Service Job"}</h1>
          <p className="text-sm text-neutral-500">{request.address}</p>
        </div>
        <div className="flex gap-2">
          <a href={customerProfile?.phone ? `tel:${customerProfile.phone}` : undefined}>
            <Button size="icon" variant="outline"><Phone className="h-4 w-4" /></Button>
          </a>
          <Button size="icon" variant="primary" onClick={() => setChatOpen(true)}><MessageCircle className="h-4 w-4" /></Button>
        </div>
      </div>

      {vehicle && (
        <p className="mt-1 text-sm text-neutral-500">{vehicle.make} {vehicle.model} {vehicle.year ?? ""} · {vehicle.registration_number}</p>
      )}

      <div className="mt-4 h-56 overflow-hidden rounded-xl">
        <LiveMap
          center={[loc.lat, loc.lng]}
          zoom={14}
          markers={[{ id: "customer", lat: loc.lat, lng: loc.lng, icon: <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white"><MapPin className="h-4 w-4" /></div>, popup: customerProfile?.full_name }]}
          className="h-full w-full"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        {request.status === "MECHANIC_ACCEPTED" && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Ready to head out?</p>
            <Button variant="primary" size="lg" onClick={startNavigation}>
              <Navigation className="h-4 w-4" /> Start Navigation
            </Button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
              target="_blank" rel="noreferrer"
              className="text-center text-sm text-orange-600 hover:underline"
            >
              Open in Google Maps
            </a>
          </div>
        )}

        {request.status === "MECHANIC_ON_THE_WAY" && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">On the way — sharing your live location</p>
            <Button variant="primary" size="lg" onClick={markArrived}>I&apos;ve Arrived</Button>
          </div>
        )}

        {request.status === "MECHANIC_ARRIVED" && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Arrived at customer location</p>
            <Button variant="primary" size="lg" onClick={beginInspection}>Start Inspection</Button>
          </div>
        )}

        {request.status === "INSPECTION" && (
          <div className="flex flex-col gap-5">
            <p className="font-semibold">Vehicle Inspection</p>
            {Object.entries(CHECKLIST).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-2 text-sm font-semibold text-neutral-700">{cat}</p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => {
                    const key = `${cat}:${item}`;
                    return (
                      <label key={key} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2 text-sm">
                        <input
                          type="checkbox"
                          defaultChecked
                          onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))}
                        />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <textarea
              className="min-h-20 rounded-lg border border-neutral-300 p-3 text-sm"
              placeholder="Inspection notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600">
              <Camera className="h-4 w-4" /> Attach before/after photos
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>

            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-700">Repair Estimate</p>
              <div className="flex flex-col gap-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={l.kind}
                      onChange={(e) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, kind: e.target.value as "labor" | "part" } : x)))}
                      className="rounded-lg border border-neutral-300 px-2 py-2 text-xs"
                    >
                      <option value="labor">Labor</option>
                      <option value="part">Part</option>
                    </select>
                    <input
                      className="flex-1 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                      placeholder="Item name"
                      value={l.name}
                      onChange={(e) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                    />
                    <input
                      type="number" min={1}
                      className="w-16 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                      value={l.quantity}
                      onChange={(e) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, quantity: Number(e.target.value) } : x)))}
                    />
                    <input
                      type="number" min={0}
                      className="w-24 rounded-lg border border-neutral-300 px-2 py-2 text-sm"
                      placeholder="PKR"
                      value={l.unit_price}
                      onChange={(e) => setLines((ls) => ls.map((x, idx) => (idx === i ? { ...x, unit_price: Number(e.target.value) } : x)))}
                    />
                    <button onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-neutral-400" /></button>
                  </div>
                ))}
                <button
                  onClick={() => setLines((ls) => [...ls, { kind: "part", name: "", quantity: 1, unit_price: 0 }])}
                  className="flex w-fit items-center gap-1 text-sm text-orange-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add line item
                </button>
              </div>
            </div>

            <Button variant="primary" size="lg" onClick={submitInspectionAndEstimate} disabled={saving}>
              {saving ? "Submitting..." : "Send Estimate to Customer"}
            </Button>
          </div>
        )}

        {request.status === "WAITING_FOR_APPROVAL" && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-orange-500" />
            <p className="font-semibold">Waiting for customer approval...</p>
            <p className="text-sm text-neutral-500">You&apos;ll be notified as soon as they respond.</p>
          </div>
        )}

        {request.status === "REPAIRING" && (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Estimate approved — repair in progress</p>
            <Button variant="primary" size="lg" onClick={completeJob} disabled={saving}>
              {saving ? "Finishing..." : "Mark Repair Complete"}
            </Button>
          </div>
        )}

        {(request.status === "PAYMENT_PENDING" || request.status === "PAID") && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="font-semibold">Job complete — PKR {request.final_price?.toLocaleString()}</p>
            <p className="text-sm text-neutral-500">
              {request.status === "PAID" ? "Payment received." : "Waiting for customer payment."}
            </p>
          </div>
        )}
      </div>

      {chatOpen && <ChatPanel requestId={request.id} currentUserId={mechanicId} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
