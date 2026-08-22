"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";

export function ProfileForm({ email, profile }: { email: string; profile: Profile }) {
  const supabase = useMemo(() => createClient(), []);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <Card className="mt-6">
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
        <Button variant="primary" onClick={save} disabled={saving} className="mt-2">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
