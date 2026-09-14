"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileForm({ userId, fullName, phone }: { userId: string; fullName: string; phone: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone: phoneValue })
      .eq("id", userId);
    setLoading(false);

    if (error) {
      toast.error("Could not update profile.");
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">Full Name</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">Phone</label>
            <Input required value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="mt-2 self-start">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
