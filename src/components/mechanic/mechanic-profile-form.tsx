"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Mechanic, MechanicVerificationStatus, Profile } from "@/lib/supabase/types";

interface DocRow { id: string; doc_type: string; file_url: string; status: MechanicVerificationStatus; uploaded_at: string }

const DOC_TYPES = ["CNIC / ID", "Driving License", "Certification", "Workshop Photo"];

const STATUS_VARIANT: Record<MechanicVerificationStatus, "warning" | "info" | "success" | "danger"> = {
  pending: "warning", under_review: "info", verified: "success", rejected: "danger", suspended: "danger",
};

export function MechanicProfileForm({
  email, profile, mechanic, documents,
}: { email: string; profile: Profile; mechanic: Mechanic; documents: DocRow[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [businessName, setBusinessName] = useState(mechanic.business_name ?? "");
  const [bio, setBio] = useState(mechanic.bio ?? "");
  const [specialties, setSpecialties] = useState(mechanic.specialties.join(", "));
  const [radius, setRadius] = useState(mechanic.service_radius_km);
  const [docs, setDocs] = useState(documents);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", profile.id);
    await supabase
      .from("mechanics")
      .update({
        business_name: businessName,
        bio,
        specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        service_radius_km: radius,
      })
      .eq("id", profile.id);
    setSaving(false);
    toast.success("Profile updated");
  }

  async function uploadDoc(docType: string, file: File) {
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("mechanic-documents").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    const fileUrl = supabase.storage.from("mechanic-documents").getPublicUrl(path).data.publicUrl;
    const { data } = await supabase
      .from("mechanic_documents")
      .insert({ mechanic_id: profile.id, doc_type: docType, file_url: fileUrl, status: "pending" })
      .select("*")
      .single();
    if (data) setDocs((d) => [...d, data as DocRow]);
    toast.success(`${docType} uploaded — pending review`);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">Verification status:</span>
        <Badge variant={STATUS_VARIANT[mechanic.verification_status]}>{mechanic.verification_status.replaceAll("_", " ")}</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
            <Input value={email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Business / Workshop name</label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Bio</label>
            <textarea className="w-full rounded-lg border border-neutral-300 p-3 text-sm" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Specialties (comma-separated)</label>
            <Input value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Engine, Electrical, Diagnostics" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Service radius (km)</label>
            <Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
          </div>
          <Button variant="primary" onClick={save} disabled={saving} className="mt-2">{saving ? "Saving..." : "Save Changes"}</Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold">Verification Documents</h2>
        <div className="mt-3 flex flex-col gap-2">
          {DOC_TYPES.map((docType) => {
            const existing = docs.filter((d) => d.doc_type === docType).at(-1);
            return (
              <div key={docType} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm">{docType}</span>
                  {existing && <Badge variant={STATUS_VARIANT[existing.status]}>{existing.status}</Badge>}
                </div>
                <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-orange-600 hover:underline">
                  <Upload className="h-3.5 w-3.5" /> {existing ? "Replace" : "Upload"}
                  <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(docType, e.target.files[0])} />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
