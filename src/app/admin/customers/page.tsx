import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Customers</h1>
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-surface-2 text-left text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-2">
              {(profiles ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(p.created_at), "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!profiles || profiles.length === 0) && (
            <p className="p-5 text-center text-sm text-muted-foreground">No customers registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
