"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markAppointmentFixed, updateAppointmentDateTime } from "@/app/admin/actions";
import type { Appointment } from "@/lib/supabase/types";

export function AppointmentActions({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [finalDate, setFinalDate] = useState(appointment.final_date ?? appointment.requested_date);
  const [finalTime, setFinalTime] = useState((appointment.final_time ?? appointment.requested_time).slice(0, 5));

  function handleUpdate(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("id", String(appointment.id));
    formData.set("finalDate", finalDate);
    formData.set("finalTime", finalTime);
    startTransition(async () => {
      const result = await updateAppointmentDateTime(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Date & time updated");
      router.refresh();
    });
  }

  function handleMarkFixed() {
    const formData = new FormData();
    formData.set("id", String(appointment.id));
    startTransition(async () => {
      const result = await markAppointmentFixed(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment marked as fixed");
      router.refresh();
    });
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <form onSubmit={handleUpdate} className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-brand-500" aria-hidden="true" /> Update Date/Time
        </h3>
        <div className="flex flex-col gap-3">
          <Input type="date" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} required />
          <Input type="time" value={finalTime} onChange={(e) => setFinalTime(e.target.value)} required />
          <Button type="submit" variant="outline" disabled={pending}>
            Save Date/Time
          </Button>
        </div>
      </form>

      <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" /> Mark Appointment Fixed
          </h3>
          <p className="text-sm text-muted-foreground">Confirms the final date/time above as agreed with the customer.</p>
        </div>
        <Button
          className="mt-4"
          variant="accent"
          disabled={pending || appointment.status === "fixed"}
          onClick={handleMarkFixed}
        >
          {appointment.status === "fixed" ? "Already Fixed" : "Mark Appointment Fixed"}
        </Button>
      </div>
    </div>
  );
}
