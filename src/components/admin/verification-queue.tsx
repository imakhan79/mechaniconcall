"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Mechanic { id: string; business_name: string | null; verification_status: string }
interface Profile { id: string; full_name: string; phone: string | null }
interface Doc { id: string; mechanic_id: string; doc_type: string; file_url: string; status: string }

export function VerificationQueue({ mechanics, profiles, documents }: { mechanics: Mechanic[]; profiles: Profile[]; documents: Doc[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(mechanics);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  async function decide(mechanicId: string, status: "verified" | "rejected") {
    const { error } = await supabase.from("mechanics").update({ verification_status: status }).eq("id", mechanicId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setItems((list) => list.filter((m) => m.id !== mechanicId));
    toast.success(status === "verified" ? "Mechanic verified" : "Mechanic rejected");
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {items.map((m) => {
        const p = profileMap.get(m.id);
        const docs = documents.filter((d) => d.mechanic_id === m.id);
        return (
          <Card key={m.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p?.full_name ?? m.business_name}</p>
                  <p className="text-xs text-neutral-500">{m.business_name} · {p?.phone}</p>
                </div>
                <Badge variant="warning">{m.verification_status.replaceAll("_", " ")}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {docs.map((d) => (
                  <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs hover:border-orange-300">
                    <FileText className="h-3 w-3" /> {d.doc_type}
                  </a>
                ))}
                {docs.length === 0 && <p className="text-xs text-neutral-400">No documents submitted yet.</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => decide(m.id, "rejected")}>Reject</Button>
                <Button variant="primary" size="sm" onClick={() => decide(m.id, "verified")}>Verify</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {items.length === 0 && <p className="text-sm text-neutral-400">No mechanics awaiting verification.</p>}
    </div>
  );
}
