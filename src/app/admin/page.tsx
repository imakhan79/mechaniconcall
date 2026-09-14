import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppointmentFilters } from "@/components/admin/appointment-filters";
import { FadeIn } from "@/components/motion/reveal";
import { AppointmentsTableBody } from "@/components/admin/appointments-table-body";

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
      <FadeIn>
        <h1 className="mb-4 font-heading text-xl font-bold text-foreground">Appointment Requests</h1>
      </FadeIn>

      <Suspense fallback={<div className="h-[52px] rounded-xl border border-border bg-surface" />}>
        <AppointmentFilters />
      </Suspense>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(2,132,199,0.18)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs font-semibold uppercase text-muted-foreground">
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
          <AppointmentsTableBody appointments={appointments ?? []} />
        </table>
      </div>
    </div>
  );
}
