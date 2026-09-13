import { Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { AppointmentFilters } from "@/components/admin/appointment-filters";

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; date?: string }>;
}) {
  const { q, status, date } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("appointments").select("*").order("created_at", { ascending: false });

  if (status === "requested" || status === "fixed") {
    query = query.eq("status", status);
  }
  if (date) {
    query = query.eq("requested_date", date);
  }
  if (q) {
    const term = q.trim().replace(/[%,]/g, "");
    const orFilters = [`car_number.ilike.%${term}%`, `owner_name.ilike.%${term}%`, `owner_mobile.ilike.%${term}%`];
    if (/^\d+$/.test(term)) orFilters.push(`id.eq.${term}`);
    query = query.or(orFilters.join(","));
  }

  const { data: appointments } = await query.limit(200);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-neutral-900">Appointment Requests</h1>

      <Suspense fallback={<div className="h-[52px] rounded-xl border border-neutral-200 bg-white" />}>
        <AppointmentFilters />
      </Suspense>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Car No.</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Requested Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(appointments ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">#{a.id}</td>
                <td className="px-4 py-3">{a.car_number}</td>
                <td className="px-4 py-3">{a.owner_name}</td>
                <td className="px-4 py-3">{a.owner_mobile}</td>
                <td className="px-4 py-3">{format(new Date(`${a.requested_date}T00:00:00`), "d MMM yyyy")}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.status === "fixed" ? "success" : "warning"}>
                    {a.status === "fixed" ? "Appointment Fixed" : "Appointment Requested"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/appointments/${a.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {(appointments ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
