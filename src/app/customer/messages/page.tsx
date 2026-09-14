import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomerMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: requests } = await supabase
    .from("service_requests")
    .select("*, mechanic:mechanics(id, business_name, profile:profiles(full_name))")
    .eq("customer_id", user!.id)
    .not("mechanic_id", "is", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Messages</h1>
      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {(requests ?? []).map((r) => {
            const mechanic = r.mechanic as unknown as
              | { business_name: string | null; profile: { full_name: string } | null }
              | undefined;
            return (
              <Link key={r.id} href={`/track/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {mechanic?.business_name || mechanic?.profile?.full_name || "Mechanic"}
                  </p>
                  <p className="text-xs text-muted-foreground">Request #{r.id}</p>
                </div>
              </Link>
            );
          })}
          {(!requests || requests.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No conversations yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
