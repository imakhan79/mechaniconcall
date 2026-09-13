"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: adminRow } = await supabase.from("workshop_admins").select("id").eq("id", user.id).maybeSingle();
  if (!adminRow) throw new Error("Unauthorized");

  return supabase;
}

const dateTimeSchema = z.object({
  id: z.coerce.number().int().positive(),
  finalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  finalTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time"),
});

export async function updateAppointmentDateTime(formData: FormData) {
  const parsed = dateTimeSchema.safeParse({
    id: formData.get("id"),
    finalDate: formData.get("finalDate"),
    finalTime: formData.get("finalTime"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please provide a valid date and time." };
  }

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("appointments")
    .update({ final_date: parsed.data.finalDate, final_time: parsed.data.finalTime })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false as const, error: "Could not update the appointment." };
  }

  revalidatePath(`/admin/appointments/${parsed.data.id}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function markAppointmentFixed(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false as const, error: "Invalid appointment." };
  }

  const supabase = await requireAdmin();

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("requested_date, requested_time, final_date, final_time")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !appointment) {
    return { ok: false as const, error: "Appointment not found." };
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status: "fixed",
      final_date: appointment.final_date ?? appointment.requested_date,
      final_time: appointment.final_time ?? appointment.requested_time,
    })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: "Could not mark the appointment as fixed." };
  }

  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin");
  return { ok: true as const };
}
