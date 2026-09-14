import { FileText, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Mechanic } from "@/lib/supabase/types";

export default async function MechanicDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mechanicId = user!.id;

  const [{ data: mechanic }, { data: documents }] = await Promise.all([
    supabase.from("mechanics").select("verification_status").eq("id", mechanicId).single(),
    supabase.from("mechanic_documents").select("*").eq("mechanic_id", mechanicId).order("created_at", { ascending: false }),
  ]);

  const status = (mechanic as Pick<Mechanic, "verification_status"> | null)?.verification_status ?? "pending";

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Documents & Verification</h1>
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Verification status</p>
              <p className="text-xs text-muted-foreground">Upload documents from your Profile page to speed up review.</p>
            </div>
            <Badge
              variant={status === "verified" ? "success" : status === "rejected" || status === "suspended" ? "danger" : "warning"}
            >
              {status.replace(/_/g, " ")}
            </Badge>
          </div>

          <ul className="flex flex-col gap-2">
            {(documents ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-foreground/90">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> {d.doc_type}
                </span>
                <Badge variant={d.status === "approved" ? "success" : d.status === "rejected" ? "danger" : "warning"}>
                  {d.status}
                </Badge>
              </li>
            ))}
            {(!documents || documents.length === 0) && (
              <li className="text-sm text-muted-foreground">No documents submitted yet — add them from your Profile page.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
