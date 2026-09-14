"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Mechanic, MechanicDocument, Profile } from "@/lib/supabase/types";

export type PendingMechanic = Mechanic & {
  profile: Profile | null;
  documents: (MechanicDocument & { signedUrl: string | null })[];
};

export function VerificationQueue({ mechanics }: { mechanics: PendingMechanic[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDecision(mechanicId: string, verified: boolean) {
    setBusyId(mechanicId);
    const supabase = createClient();
    const { error } = await supabase
      .from("mechanics")
      .update({ verification_status: verified ? "verified" : "rejected" })
      .eq("id", mechanicId);
    setBusyId(null);
    if (error) {
      toast.error("Could not update verification status.");
      return;
    }
    toast.success(verified ? "Mechanic verified" : "Mechanic rejected");
    router.refresh();
  }

  if (mechanics.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-sm text-muted-foreground">No mechanics awaiting verification.</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {mechanics.map((m) => (
        <Card key={m.id}>
          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{m.profile?.full_name ?? "Mechanic"}</p>
                <p className="text-xs text-muted-foreground">{m.business_name ?? "No business name set"}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busyId === m.id} onClick={() => handleDecision(m.id, false)}>
                  Reject
                </Button>
                <Button size="sm" variant="primary" disabled={busyId === m.id} onClick={() => handleDecision(m.id, true)}>
                  Verify
                </Button>
              </div>
            </div>
            <ul className="flex flex-col gap-1">
              {m.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {d.signedUrl ? (
                    <a href={d.signedUrl} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                      {d.doc_type}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{d.doc_type} (unavailable)</span>
                  )}
                </li>
              ))}
              {m.documents.length === 0 && <li className="text-sm text-muted-foreground">No documents submitted.</li>}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
