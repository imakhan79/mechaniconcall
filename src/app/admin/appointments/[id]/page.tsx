import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { formatSlotTime } from "@/lib/utils";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: appointment } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();

  if (!appointment) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Appointment #{appointment.id}</h1>
        <Badge variant={appointment.status === "fixed" ? "success" : "warning"}>
          {appointment.status === "fixed" ? "Appointment Fixed" : "Appointment Requested"}
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <Info label="Car Number" value={appointment.car_number} />
          <Info label="Owner Name" value={appointment.owner_name} />
          <Info label="Owner Mobile" value={appointment.owner_mobile} />
          <div />
          <Info
            label="Requested Date"
            value={format(new Date(`${appointment.requested_date}T00:00:00`), "d MMMM yyyy")}
          />
          <Info label="Requested Time" value={formatSlotTime(appointment.requested_time)} />
          <Info
            label="Final Date"
            value={appointment.final_date ? format(new Date(`${appointment.final_date}T00:00:00`), "d MMMM yyyy") : "—"}
          />
          <Info label="Final Time" value={appointment.final_time ? formatSlotTime(appointment.final_time) : "—"} />
        </CardContent>
      </Card>

      <AppointmentActions appointment={appointment} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
