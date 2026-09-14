"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Car, ChevronLeft, Loader2, MapPin, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LiveMap } from "@/components/map/live-map";
import { cn } from "@/lib/utils";
import { getCurrentPosition, reverseGeocode, searchAddress, type AddressResult, type GeoPosition } from "@/lib/geo";
import type { ServiceCategory, Vehicle } from "@/lib/supabase/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = ["Location", "Vehicle & Service", "Details"] as const;

export function RequestWizard({
  customerId,
  vehicles,
  categories,
}: {
  customerId: string;
  vehicles: Vehicle[];
  categories: ServiceCategory[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [vehicleId, setVehicleId] = useState<string | null>(vehicles[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      const label = await reverseGeocode(pos).catch(() => `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
      setAddress(label);
    } catch {
      toast.error("Could not get your location. Try searching for an address instead.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchAddress(searchQuery);
    setSearchResults(results);
    setSearching(false);
  }

  function pickSearchResult(result: AddressResult) {
    setPosition({ lat: result.lat, lng: result.lng });
    setAddress(result.label);
    setSearchResults([]);
    setSearchQuery("");
  }

  async function handleSubmit() {
    if (!position || !categoryId) return;
    setSubmitting(true);
    const supabase = createClient();

    let photoUrls: string[] = [];
    if (photo) {
      const path = `${customerId}/${Date.now()}-${photo.name}`;
      const { error: uploadError } = await supabase.storage.from("service-media").upload(path, photo);
      if (!uploadError) {
        const { data } = supabase.storage.from("service-media").getPublicUrl(path);
        photoUrls = [data.publicUrl];
      }
    }

    const category = categories.find((c) => c.id === categoryId);

    const { data: request, error } = await supabase
      .from("service_requests")
      .insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        category_id: categoryId,
        status: "SEARCHING",
        is_emergency: isEmergency || category?.is_emergency || false,
        lat: position.lat,
        lng: position.lng,
        address,
        description: description || null,
        photo_urls: photoUrls,
        estimated_price: category?.base_price ?? null,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (error || !request) {
      toast.error("Could not submit your request. Please try again.");
      return;
    }

    router.push(`/track/${request.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <ol className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i === step ? "bg-brand-500 text-white" : i < step ? "bg-border text-brand-600" : "bg-surface-2 text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <span className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 0 && (
              <motion.div
                key="location"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-brand-500" aria-hidden="true" /> Where do you need help?
                </h2>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={locating}
                  onClick={handleUseCurrentLocation}
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Use my current location
                </Button>

                <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or search <span className="h-px flex-1 bg-border" />
                </div>

                <div className="relative">
                  <Input
                    placeholder="Search for an address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    aria-label="Search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-500"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <ul className="mt-2 flex flex-col divide-y divide-surface-2 rounded-lg border border-border">
                    {searchResults.map((r) => (
                      <li key={`${r.lat}-${r.lng}`}>
                        <button
                          type="button"
                          onClick={() => pickSearchResult(r)}
                          className="block w-full px-3 py-2 text-left text-sm text-foreground/90 hover:bg-brand-500/10"
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {position && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="h-40 overflow-hidden rounded-lg">
                      <LiveMap center={position} zoom={15} markers={[{ id: "loc", lat: position.lat, lng: position.lng }]} />
                    </div>
                    <p className="text-xs text-muted-foreground">{address}</p>
                  </div>
                )}

                <Button className="mt-5 w-full" size="lg" variant="primary" disabled={!position} onClick={() => goTo(1)}>
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="vehicle"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Car className="h-4 w-4 text-brand-500" aria-hidden="true" /> Vehicle
                </h2>
                {vehicles.length > 0 ? (
                  <select
                    value={vehicleId ?? ""}
                    onChange={(e) => setVehicleId(e.target.value || null)}
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground/90"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} — {v.registration_number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No vehicles on file yet — add one from your{" "}
                    <a href="/customer/vehicles" className="font-medium text-brand-500 hover:underline">
                      Vehicles page
                    </a>{" "}
                    first, or continue without selecting one.
                  </p>
                )}

                <h2 className="mb-3 mt-5 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Wrench className="h-4 w-4 text-brand-500" aria-hidden="true" /> Service
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors",
                        categoryId === c.id
                          ? "border-brand-500 bg-brand-500/10 text-brand-600"
                          : "border-border text-foreground/90 hover:border-brand-400"
                      )}
                    >
                      {c.name}
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">from Rs {c.base_price}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex gap-3">
                  <Button type="button" variant="outline" size="lg" onClick={() => goTo(0)}>
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button className="flex-1" size="lg" variant="primary" disabled={!categoryId} onClick={() => goTo(2)}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="details"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Wrench className="h-4 w-4 text-brand-500" aria-hidden="true" /> Details
                </h2>

                <label className="mb-1 block text-sm font-medium text-foreground/90">What&apos;s wrong? (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  placeholder="e.g. Car won't start, battery might be dead"
                />

                <label className="mb-1 mt-3 block text-sm font-medium text-foreground/90">Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-500"
                />

                <button
                  type="button"
                  onClick={() => setIsEmergency((v) => !v)}
                  className={cn(
                    "mt-4 flex w-full items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors",
                    isEmergency ? "border-red-500 bg-red-50 text-red-700" : "border-border text-muted-foreground"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  This is an emergency
                </button>

                <div className="mt-5 flex gap-3">
                  <Button type="button" variant="outline" size="lg" onClick={() => goTo(1)} disabled={submitting}>
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    variant={isEmergency ? "emergency" : "primary"}
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Submitting..." : "Find a Mechanic"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -24 : 24 }),
};
