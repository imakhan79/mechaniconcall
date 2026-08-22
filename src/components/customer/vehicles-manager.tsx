"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Car, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle, VehicleType } from "@/lib/supabase/types";

export function VehiclesManager({ customerId, initialVehicles }: { customerId: string; initialVehicles: Vehicle[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vehicle_type: "car" as VehicleType, make: "", model: "", year: "", registration_number: "", vin: "", color: "", fuel_type: "", mileage: "" });

  async function addVehicle() {
    if (!form.make || !form.model) {
      toast.error("Make and model are required");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: customerId,
        vehicle_type: form.vehicle_type,
        make: form.make,
        model: form.model,
        year: form.year ? Number(form.year) : null,
        registration_number: form.registration_number || null,
        vin: form.vin || null,
        color: form.color || null,
        fuel_type: form.fuel_type || null,
        mileage: form.mileage ? Number(form.mileage) : null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVehicles((v) => [data as Vehicle, ...v]);
    setForm({ vehicle_type: "car", make: "", model: "", year: "", registration_number: "", vin: "", color: "", fuel_type: "", mileage: "" });
    setShowForm(false);
    toast.success("Vehicle added");
  }

  async function removeVehicle(id: string) {
    if (!confirm("Remove this vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setVehicles((v) => v.filter((x) => x.id !== id));
  }

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardContent className="flex items-start justify-between py-4">
              <div className="flex gap-3">
                <Car className="h-8 w-8 shrink-0 text-neutral-400" />
                <div>
                  <p className="font-medium">{v.make} {v.model} {v.year ?? ""}</p>
                  <p className="text-xs text-neutral-500">{v.registration_number ?? "No plate"} · {v.fuel_type ?? "—"}</p>
                  {v.mileage != null && <p className="text-xs text-neutral-400">{v.mileage.toLocaleString()} km</p>}
                </div>
              </div>
              <button onClick={() => removeVehicle(v.id)}><Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600" /></button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline">
          <Plus className="h-4 w-4" /> Add a vehicle
        </button>
      ) : (
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Make" value={form.make} onChange={(e) => setForm((s) => ({ ...s, make: e.target.value }))} />
              <Input placeholder="Model" value={form.model} onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))} />
              <Input placeholder="Year" value={form.year} onChange={(e) => setForm((s) => ({ ...s, year: e.target.value }))} />
              <Input placeholder="Registration No." value={form.registration_number} onChange={(e) => setForm((s) => ({ ...s, registration_number: e.target.value }))} />
              <Input placeholder="VIN" value={form.vin} onChange={(e) => setForm((s) => ({ ...s, vin: e.target.value }))} />
              <Input placeholder="Color" value={form.color} onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))} />
              <Input placeholder="Fuel type" value={form.fuel_type} onChange={(e) => setForm((s) => ({ ...s, fuel_type: e.target.value }))} />
              <Input placeholder="Mileage (km)" value={form.mileage} onChange={(e) => setForm((s) => ({ ...s, mileage: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={addVehicle} disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Vehicle"}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
