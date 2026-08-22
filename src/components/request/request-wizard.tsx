"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin, Loader2, Car, Bike, Truck, Bus, AlertTriangle, Camera, X, ChevronLeft,
  ChevronRight, Gauge, Disc, Battery, BatteryCharging, Droplet, Wind, Thermometer,
  Fuel, Lock, Zap, ScanLine, Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPosition, reverseGeocode, searchAddress } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ServiceCategory, Vehicle, VehicleType, SavedLocation } from "@/lib/supabase/types";

const ICONS: Record<string, React.ElementType> = {
  engine: Gauge, tire: Disc, battery: Battery, "battery-full": BatteryCharging,
  droplet: Droplet, disc: Disc, wind: Wind, thermometer: Thermometer, fuel: Fuel,
  lock: Lock, truck: Truck, zap: Zap, scan: ScanLine, "alert-triangle": AlertTriangle,
};

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: React.ElementType }[] = [
  { type: "car", label: "Car", icon: Car },
  { type: "bike", label: "Bike", icon: Bike },
  { type: "truck", label: "Truck", icon: Truck },
  { type: "van", label: "Van", icon: Truck },
  { type: "bus", label: "Bus", icon: Bus },
  { type: "commercial", label: "Commercial", icon: Truck },
];

const STEPS = ["Location", "Vehicle", "Problem", "Details", "Confirm"];

export function RequestWizard({
  categories,
  vehicles,
  savedLocations,
  customerId,
}: {
  categories: ServiceCategory[];
  vehicles: Vehicle[];
  savedLocations: SavedLocation[];
  customerId: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isEmergency, setIsEmergency] = useState(search.get("emergency") === "1");
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);

  // step 1: location
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  // step 2: vehicle
  const [vehicleId, setVehicleId] = useState<string>(vehicles[0]?.id ?? "");
  const [showNewVehicle, setShowNewVehicle] = useState(vehicles.length === 0);
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "car" as VehicleType, make: "", model: "", year: "", registration_number: "" });

  // step 3: problem
  const [categorySlug, setCategorySlug] = useState(search.get("category") ?? "");

  // step 4: details
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const estimatedPrice = selectedCategory
    ? Math.round(selectedCategory.base_price * (isEmergency ? 1.25 : 1))
    : null;

  async function useMyLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get your location.");
    } finally {
      setLocating(false);
    }
  }

  async function runAddressSearch(q: string) {
    setAddressQuery(q);
    if (q.length < 3) {
      setAddressResults([]);
      return;
    }
    setAddressResults(await searchAddress(q));
  }

  function canAdvance() {
    if (step === 0) return !!coords && !!address;
    if (step === 1) return showNewVehicle ? newVehicle.make && newVehicle.model : !!vehicleId;
    if (step === 2) return !!categorySlug;
    return true;
  }

  async function handleSubmit() {
    if (!coords) return;
    setSubmitting(true);
    try {
      let finalVehicleId = vehicleId || null;

      if (showNewVehicle && newVehicle.make && newVehicle.model) {
        const { data: v, error } = await supabase
          .from("vehicles")
          .insert({
            customer_id: customerId,
            vehicle_type: newVehicle.vehicle_type,
            make: newVehicle.make,
            model: newVehicle.model,
            year: newVehicle.year ? Number(newVehicle.year) : null,
            registration_number: newVehicle.registration_number || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        finalVehicleId = v.id;
      }

      let mediaUrls: string[] = [];
      if (files.length) {
        setUploading(true);
        const uploads = await Promise.all(
          files.map(async (file) => {
            const path = `${customerId}/${Date.now()}-${file.name}`;
            const { error } = await supabase.storage.from("service-media").upload(path, file);
            if (error) throw error;
            return supabase.storage.from("service-media").getPublicUrl(path).data.publicUrl;
          })
        );
        mediaUrls = uploads;
        setUploading(false);
      }

      const category = categories.find((c) => c.slug === categorySlug);

      const { data: reqRow, error: reqError } = await supabase
        .from("service_requests")
        .insert({
          customer_id: customerId,
          vehicle_id: finalVehicleId,
          category_id: category?.id ?? null,
          status: "SEARCHING",
          is_emergency: isEmergency,
          emergency_type: isEmergency ? "other" : null,
          description: description || null,
          media_urls: mediaUrls,
          lat: coords.lat,
          lng: coords.lng,
          address,
          estimated_price: estimatedPrice,
        })
        .select("id")
        .single();

      if (reqError) throw reqError;

      await supabase.from("service_request_status_history").insert({
        request_id: reqRow.id,
        status: "SEARCHING",
        note: "Customer submitted request",
      });

      toast.success("Finding the best mechanic near you...");
      router.push(`/track/${reqRow.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit request.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  function onEmergencyToggle(next: boolean) {
    if (next) setShowEmergencyConfirm(true);
    else setIsEmergency(false);
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-neutral-50 px-4 pb-28 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Home
        </button>
        <button
          onClick={() => onEmergencyToggle(!isEmergency)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            isEmergency ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-red-50 text-red-600"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> {isEmergency ? "EMERGENCY MODE ON" : "Mark as Emergency"}
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-orange-600 text-white" : "bg-neutral-200 text-neutral-500"
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-orange-600" : "bg-neutral-200"}`} />}
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm font-medium text-neutral-500">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Where is your vehicle?</h2>
            <Button type="button" variant="primary" size="lg" onClick={useMyLocation} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Use My Current Location
            </Button>

            {coords && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <p className="font-medium">{address}</p>
                <p className="text-xs text-green-700">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · accuracy-verified
                </p>
              </div>
            )}

            <div className="relative">
              <Input
                placeholder="Or search an address..."
                value={addressQuery}
                onChange={(e) => runAddressSearch(e.target.value)}
              />
              {addressResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg">
                  {addressResults.map((r) => (
                    <button
                      key={r.display_name}
                      className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-neutral-50"
                      onClick={() => {
                        setCoords({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                        setAddress(r.display_name);
                        setAddressResults([]);
                        setAddressQuery(r.display_name);
                      }}
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {savedLocations.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-neutral-400">Saved locations</p>
                <div className="flex flex-wrap gap-2">
                  {savedLocations.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setCoords({ lat: l.lat, lng: l.lng });
                        setAddress(l.address);
                      }}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs hover:border-orange-300"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Select your vehicle</h2>

            {vehicles.length > 0 && !showNewVehicle && (
              <div className="flex flex-col gap-2">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left ${
                      vehicleId === v.id ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{v.make} {v.model} {v.year ?? ""}</p>
                      <p className="text-xs text-neutral-500">{v.registration_number ?? "No plate on file"}</p>
                    </div>
                    <Car className="h-5 w-5 text-neutral-400" />
                  </button>
                ))}
                <button onClick={() => setShowNewVehicle(true)} className="text-left text-sm font-medium text-orange-600 hover:underline">
                  + Add a different vehicle
                </button>
              </div>
            )}

            {showNewVehicle && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {VEHICLE_TYPES.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewVehicle((s) => ({ ...s, vehicle_type: type }))}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${
                        newVehicle.vehicle_type === type ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Make (e.g. Toyota)" value={newVehicle.make} onChange={(e) => setNewVehicle((s) => ({ ...s, make: e.target.value }))} />
                  <Input placeholder="Model (e.g. Corolla)" value={newVehicle.model} onChange={(e) => setNewVehicle((s) => ({ ...s, model: e.target.value }))} />
                  <Input placeholder="Year" value={newVehicle.year} onChange={(e) => setNewVehicle((s) => ({ ...s, year: e.target.value }))} />
                  <Input placeholder="Registration No." value={newVehicle.registration_number} onChange={(e) => setNewVehicle((s) => ({ ...s, registration_number: e.target.value }))} />
                </div>
                {vehicles.length > 0 && (
                  <button onClick={() => setShowNewVehicle(false)} className="text-left text-sm text-neutral-500 hover:underline">
                    ← Use a saved vehicle instead
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">What&apos;s the problem?</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((c) => {
                const Icon = ICONS[c.icon ?? ""] ?? Wrench;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategorySlug(c.slug)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-sm ${
                      categorySlug === c.slug ? "border-orange-500 bg-orange-50" : "border-neutral-200"
                    }`}
                  >
                    <Icon className="h-5 w-5" /> {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Tell us more</h2>
            <textarea
              className="min-h-28 w-full rounded-lg border border-neutral-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
              placeholder="Describe what's wrong with your vehicle..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div>
              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 hover:border-orange-400">
                <Camera className="h-4 w-4" /> Add photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])}
                />
              </label>
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs">
                      {f.name}
                      <button onClick={() => setFiles((arr) => arr.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Confirm your request</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Location" value={address} />
              <Row
                label="Vehicle"
                value={showNewVehicle ? `${newVehicle.make} ${newVehicle.model}` : (vehicles.find((v) => v.id === vehicleId)?.make ?? "") + " " + (vehicles.find((v) => v.id === vehicleId)?.model ?? "")}
              />
              <Row label="Problem" value={selectedCategory?.name ?? "—"} />
              <Row label="Priority" value={isEmergency ? "🚨 Emergency" : "Standard"} />
              <Row label="Estimated service fee" value={estimatedPrice ? `PKR ${estimatedPrice.toLocaleString()}` : "Calculated after inspection"} />
            </dl>
            {isEmergency && (
              <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                This request will be flagged high-priority and nearby mechanics + operations will be notified immediately.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" size="lg" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="flex-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant={isEmergency ? "emergency" : "primary"}
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? (uploading ? "Uploading photos..." : "Submitting...") : "Find My Mechanic"}
            </Button>
          )}
        </div>
      </div>

      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-600" />
            <h3 className="mt-3 text-lg font-bold">Confirm Emergency</h3>
            <p className="mt-2 text-sm text-neutral-500">
              This will notify nearby mechanics and our operations team as a high-priority emergency. Only continue if you need urgent help.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEmergencyConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="emergency"
                className="flex-1"
                onClick={() => {
                  setIsEmergency(true);
                  setShowEmergencyConfirm(false);
                }}
              >
                Yes, It&apos;s an Emergency
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
