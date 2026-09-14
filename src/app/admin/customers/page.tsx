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
      <h1 className="mb-4 font-heading text-xl font-bold text-neutral-900">Customers</h1>
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-sky-50/60 text-left text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(profiles ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{format(new Date(p.created_at), "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!profiles || profiles.length === 0) && (
            <p className="p-5 text-center text-sm text-neutral-400">No customers registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
