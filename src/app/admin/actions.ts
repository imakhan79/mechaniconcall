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

export async function adminCancelRequest(requestId: number) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("service_requests")
    .update({ status: "CANCELLED", cancelled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { ok: false as const, error: "Could not cancel this booking." };
  revalidatePath("/admin/requests");
  return { ok: true as const };
}

export async function adminAssignMechanic(requestId: number, mechanicId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("service_requests")
    .update({ mechanic_id: mechanicId, status: "MECHANIC_ASSIGNED" })
    .eq("id", requestId);
  if (error) return { ok: false as const, error: "Could not assign a mechanic." };
  revalidatePath("/admin/requests");
  return { ok: true as const };
}

export async function adminUpdateServiceCategory(formData: FormData) {
  const id = String(formData.get("id"));
  const basePrice = Number(formData.get("base_price"));
  const isEmergency = formData.get("is_emergency") === "on";
  if (!id || Number.isNaN(basePrice)) return { ok: false as const, error: "Invalid input." };

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("service_categories")
    .update({ base_price: basePrice, is_emergency: isEmergency })
    .eq("id", id);
  if (error) return { ok: false as const, error: "Could not update pricing." };
  revalidatePath("/admin/pricing");
  return { ok: true as const };
}

export async function adminUpdateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  if (error) return { ok: false as const, error: "Could not update ticket." };
  revalidatePath("/admin/support");
  return { ok: true as const };
}
