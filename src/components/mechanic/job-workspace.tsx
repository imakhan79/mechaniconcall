"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Navigation, Phone, Plus, Trash2, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveMap } from "@/components/map/live-map";
import { ChatPanel } from "@/components/chat/chat-panel";
import { formatAED } from "@/lib/currency";
import type { Profile, ServiceCategory, ServiceRequest, Vehicle } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  MECHANIC_ACCEPTED: "Accepted — head over when ready",
  MECHANIC_ON_THE_WAY: "On the way",
  MECHANIC_ARRIVED: "Arrived",
  INSPECTION: "Inspecting",
  WAITING_FOR_APPROVAL: "Waiting for customer approval",
  REPAIRING: "Repairing",
  PAYMENT_PENDING: "Awaiting payment",
  PAID: "Paid — completed",
  CANCELLED: "Cancelled",
};

type EstimateLine = { kind: "labor" | "part"; name: string; quantity: number; unit_price: number };
type ChecklistItem = { category: string; item: string; is_ok: boolean };

function generateInvoiceNumber(requestId: number) {
  return `INV-${requestId}-${Date.now()}`;
}

export function JobWorkspace({
  mechanicId,
  initialRequest,
  customerProfile,
  vehicle,
  category,
}: {
  mechanicId: string;
  initialRequest: ServiceRequest;
  customerProfile: Profile | null;
  vehicle: Vehicle | null;
  category: ServiceCategory | null;
}) {
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [busy, setBusy] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [lines, setLines] = useState<EstimateLine[]>([{ kind: "labor", name: "Labor", quantity: 1, unit_price: 0 }]);

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
        .channel(`job-${initialRequest.id}`)
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
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [initialRequest.id]);

  function startNavigation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLocation({ lat, lng });
        const supabase = createClient();
        await supabase.from("mechanics").update({ current_lat: lat, current_lng: lng }).eq("id", mechanicId);
        await supabase
          .from("mechanic_locations")
          .upsert({ mechanic_id: mechanicId, request_id: request.id, lat, lng }, { onConflict: "mechanic_id" });
      },
      () => toast.error("Could not track your location."),
      { enableHighAccuracy: true }
    );
    updateStatus({ status: "MECHANIC_ON_THE_WAY" });
  }

  async function updateStatus(fields: Partial<ServiceRequest>) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("service_requests").update(fields).eq("id", request.id);
    setBusy(false);
    if (error) {
      toast.error("Could not update the job.");
      return false;
    }
    setRequest((r) => ({ ...r, ...fields }));
    return true;
  }

  function addChecklistItem() {
    if (!newItem.trim()) return;
    setChecklist((prev) => [...prev, { category: "General", item: newItem.trim(), is_ok: true }]);
    setNewItem("");
  }

  function addLine() {
    setLines((prev) => [...prev, { kind: "part", name: "", quantity: 1, unit_price: 0 }]);
  }

  function updateLine(i: number, patch: Partial<EstimateLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const grandTotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  async function submitEstimate() {
    setBusy(true);
    const supabase = createClient();

    const { data: inspection, error: inspError } = await supabase
      .from("inspections")
      .insert({ request_id: request.id, mechanic_id: mechanicId, notes: notes || null })
      .select("id")
      .single();

    if (inspError || !inspection) {
      setBusy(false);
      toast.error("Could not save inspection.");
      return;
    }

    if (checklist.length > 0) {
      await supabase
        .from("inspection_items")
        .insert(checklist.map((c) => ({ inspection_id: inspection.id, category: c.category, item: c.item, is_ok: c.is_ok })));
    }

    const laborTotal = lines.filter((l) => l.kind === "labor").reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const partsTotal = lines.filter((l) => l.kind === "part").reduce((s, l) => s + l.quantity * l.unit_price, 0);

    const { data: estimate, error: estError } = await supabase
      .from("repair_estimates")
      .insert({
        request_id: request.id,
        labor_total: laborTotal,
        parts_total: partsTotal,
        service_fee: 0,
        tax_total: 0,
        grand_total: grandTotal,
      })
      .select("id")
      .single();

    if (estError || !estimate) {
      setBusy(false);
      toast.error("Could not save estimate.");
      return;
    }

    await supabase.from("estimate_items").insert(
      lines.filter((l) => l.name.trim()).map((l) => ({ estimate_id: estimate.id, kind: l.kind, name: l.name, quantity: l.quantity, unit_price: l.unit_price }))
    );

    await updateStatus({ status: "WAITING_FOR_APPROVAL", estimated_price: grandTotal });
    setBusy(false);
    toast.success("Estimate sent to customer");
  }

  async function completeJob() {
    setBusy(true);
    const supabase = createClient();

    const { data: estimate } = await supabase
      .from("repair_estimates")
      .select("*, items:estimate_items(*)")
      .eq("request_id", request.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const total = estimate?.grand_total ?? request.estimated_price ?? 0;

    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: generateInvoiceNumber(request.id),
        request_id: request.id,
        customer_id: request.customer_id,
        mechanic_id: mechanicId,
        subtotal: total,
        total,
      })
      .select("id")
      .single();

    if (invError || !invoice) {
      setBusy(false);
      toast.error("Could not generate invoice.");
      return;
    }

    if (estimate?.items) {
      await supabase.from("invoice_items").insert(
        (estimate.items as { name: string; quantity: number; unit_price: number }[]).map((i) => ({
          invoice_id: invoice.id,
          description: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }))
      );
    }

    const platformFee = total * 0.15;
    await supabase.from("mechanic_earnings").insert({
      mechanic_id: mechanicId,
      request_id: request.id,
      gross_amount: total,
      platform_fee: platformFee,
      net_amount: total - platformFee,
    });

    await updateStatus({ status: "PAYMENT_PENDING", final_price: total, completed_at: new Date().toISOString() });
    setBusy(false);
    toast.success("Job marked complete");
  }

  const requestMarker = { id: "request", lat: request.lat, lng: request.lng, label: "Customer", color: "#3b82f6" };
  const myMarker = myLocation ? [{ id: "me", lat: myLocation.lat, lng: myLocation.lng, label: "You", color: "#8ed600" }] : [];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-lg font-bold text-foreground">Job #{request.id}</h1>
            <Badge variant={request.status === "CANCELLED" ? "danger" : request.status === "PAID" ? "success" : "info"}>
              {STATUS_LABELS[request.status] ?? request.status}
            </Badge>
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {category?.name ?? "Service"}
              {vehicle && ` · ${vehicle.make} ${vehicle.model}`}
            </p>
            <p className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {request.address}
            </p>
            {customerProfile && (
              <p className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> {customerProfile.full_name}
                {customerProfile.phone && ` · ${customerProfile.phone}`}
              </p>
            )}
            {request.description && <p className="mt-1 text-muted-foreground">&quot;{request.description}&quot;</p>}
          </div>
        </CardContent>
      </Card>

      <div className="h-56 overflow-hidden rounded-xl border border-border">
        <LiveMap center={{ lat: request.lat, lng: request.lng }} zoom={13} markers={[requestMarker, ...myMarker]} />
      </div>

      {request.status === "MECHANIC_ACCEPTED" && (
        <Button variant="primary" size="lg" disabled={busy} onClick={startNavigation}>
          <Navigation className="h-4 w-4" /> Start Navigation
        </Button>
      )}

      {request.status === "MECHANIC_ON_THE_WAY" && (
        <Button variant="primary" size="lg" disabled={busy} onClick={() => updateStatus({ status: "MECHANIC_ARRIVED", arrived_at: new Date().toISOString() })}>
          <CheckCircle2 className="h-4 w-4" /> Mark Arrived
        </Button>
      )}

      {request.status === "MECHANIC_ARRIVED" && (
        <Button variant="primary" size="lg" disabled={busy} onClick={() => updateStatus({ status: "INSPECTION" })}>
          Start Inspection
        </Button>
      )}

      {request.status === "INSPECTION" && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Inspection Checklist</h2>
              <ul className="mb-2 flex flex-col gap-1">
                {checklist.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-sm">
                    {c.item}
                    <button type="button" onClick={() => setChecklist((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input placeholder="Checked item (e.g. Brake pads)" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <Button type="button" size="icon" variant="outline" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Inspection notes"
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Repair Estimate</h2>
              <div className="flex flex-col gap-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1.5">
                    <Input placeholder="Item" value={l.name} onChange={(e) => updateLine(i, { name: e.target.value })} className="h-9" />
                    <Input
                      type="number"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                      className="h-9 w-16"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={l.unit_price}
                      onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) })}
                      className="h-9 w-20"
                    />
                    <button type="button" onClick={() => removeLine(i)} aria-label="Remove line">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addLine}>
                <Plus className="h-4 w-4" /> Add Line
              </Button>
              <p className="mt-2 text-right text-sm font-semibold text-foreground">Total: {formatAED(grandTotal)}</p>
            </div>

            <Button variant="primary" disabled={busy} onClick={submitEstimate}>
              Send Estimate to Customer
            </Button>
          </CardContent>
        </Card>
      )}

      {request.status === "WAITING_FOR_APPROVAL" && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Waiting for the customer to approve your estimate.</CardContent>
        </Card>
      )}

      {request.status === "REPAIRING" && (
        <Button variant="accent" size="lg" disabled={busy} onClick={completeJob}>
          <CheckCircle2 className="h-4 w-4" /> Mark Repair Complete
        </Button>
      )}

      {(request.status === "PAYMENT_PENDING" || request.status === "PAID") && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {request.status === "PAID" ? "Job completed and paid." : "Waiting for the customer to complete payment."}
          </CardContent>
        </Card>
      )}

      {request.status !== "CANCELLED" && <ChatPanel requestId={request.id} userId={mechanicId} />}

      <Button variant="ghost" onClick={() => router.push("/mechanic")}>
        Back to Dashboard
      </Button>
    </div>
  );
}
