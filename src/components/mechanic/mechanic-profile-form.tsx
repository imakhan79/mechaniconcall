"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Mechanic, MechanicDocument } from "@/lib/supabase/types";

export function MechanicProfileForm({
  mechanicId,
  mechanic,
  documents,
}: {
  mechanicId: string;
  mechanic: Mechanic;
  documents: MechanicDocument[];
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(mechanic.business_name ?? "");
  const [specialties, setSpecialties] = useState(mechanic.specialties.join(", "));
  const [radius, setRadius] = useState(String(mechanic.service_radius_km));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("mechanics")
      .update({
        business_name: businessName || null,
        specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        service_radius_km: Number(radius) || 15,
      })
      .eq("id", mechanicId);
    setSaving(false);
    if (error) {
      toast.error("Could not save business profile.");
      return;
    }
    toast.success("Business profile updated");
    router.refresh();
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const path = `${mechanicId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("mechanic-documents").upload(path, file);
    if (uploadError) {
      setUploading(false);
      toast.error("Could not upload document.");
      return;
    }
    const { error } = await supabase.from("mechanic_documents").insert({
      mechanic_id: mechanicId,
      doc_type: "verification",
      file_url: path,
    });
    setUploading(false);
    if (error) {
      toast.error("Could not record document.");
      return;
    }
    toast.success("Document submitted for review");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Business Profile</h2>
            <Badge
              variant={
                mechanic.verification_status === "verified"
                  ? "success"
                  : mechanic.verification_status === "rejected" || mechanic.verification_status === "suspended"
                    ? "danger"
                    : "warning"
              }
            >
              {mechanic.verification_status.replace(/_/g, " ")}
            </Badge>
          </div>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Business Name</label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Ahmed Auto Repair" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Specialties (comma-separated)</label>
              <Input value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Engine, Brakes, Electrical" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Service Radius (km)</label>
              <Input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </div>
            <Button type="submit" variant="primary" disabled={saving} className="self-start">
              {saving ? "Saving..." : "Save Business Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Verification Documents</h2>
          <ul className="mb-3 flex flex-col gap-2">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-neutral-700">
                  <FileText className="h-4 w-4 text-neutral-400" aria-hidden="true" /> {d.doc_type}
                </span>
                <Badge variant={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}>
                  {d.status}
                </Badge>
              </li>
            ))}
            {documents.length === 0 && <li className="text-sm text-neutral-400">No documents submitted yet.</li>}
          </ul>
          <input
            type="file"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700"
          />
        </CardContent>
      </Card>
    </div>
  );
}
