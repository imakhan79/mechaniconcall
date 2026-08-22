import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomerMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .eq("customer_id", user.id)
    .not("mechanic_id", "is", null)
    .order("requested_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-neutral-500">Conversations are tied to each service request.</p>
      <div className="mt-6 flex flex-col gap-3">
        {(requests ?? []).map((r) => (
          <Link key={r.id} href={`/track/${r.id}`}>
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <MessageCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium">{r.address}</p>
                  <p className="text-xs text-neutral-500">{new Date(r.requested_at).toLocaleString()} · {r.status.replaceAll("_", " ")}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(requests ?? []).length === 0 && <p className="text-sm text-neutral-400">No conversations yet.</p>}
      </div>
    </div>
  );
}
