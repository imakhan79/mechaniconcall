"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Vehicle, VehicleType } from "@/lib/supabase/types";

const VEHICLE_TYPES: VehicleType[] = ["car", "motorcycle", "truck", "van", "other"];

export function VehiclesManager({ customerId, vehicles }: { customerId: string; vehicles: Vehicle[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").insert({
      customer_id: customerId,
      vehicle_type: vehicleType,
      make,
      model,
      year: year ? Number(year) : null,
      registration_number: registration,
    });
    setPending(false);

    if (error) {
      toast.error("Could not add vehicle.");
      return;
    }

    toast.success("Vehicle added");
    setMake("");
    setModel("");
    setYear("");
    setRegistration("");
    router.refresh();
  }

  async function handleDelete(id: string, label: string) {
    if (!window.confirm(`Remove ${label}?`)) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    setPending(false);

    if (error) {
      toast.error("Could not remove vehicle.");
      return;
    }

    toast.success("Vehicle removed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-5">
          <ul className="flex flex-col divide-y divide-neutral-100">
            {vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                    <Car className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {v.registration_number} · <span className="capitalize">{v.vehicle_type}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${v.make} ${v.model}`}
                  disabled={pending}
                  onClick={() => handleDelete(v.id, `${v.make} ${v.model}`)}
                  className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {vehicles.length === 0 && <li className="py-3 text-sm text-neutral-400">No vehicles added yet.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Add a Vehicle</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="col-span-2 h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm capitalize text-neutral-700 sm:col-span-1"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
            <Input placeholder="Registration No." required value={registration} onChange={(e) => setRegistration(e.target.value)} />
            <Input placeholder="Make (e.g. Toyota)" required value={make} onChange={(e) => setMake(e.target.value)} />
            <Input placeholder="Model (e.g. Corolla)" required value={model} onChange={(e) => setModel(e.target.value)} />
            <Input placeholder="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            <Button type="submit" variant="primary" disabled={pending} className="col-span-2 sm:col-span-1">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Vehicle
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
