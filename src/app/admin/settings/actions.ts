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

function afterWrite() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

const slotSchema = z.object({
  label: z.string().trim().min(1, "Enter a label").max(20, "Too long"),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
});

export async function addTimeSlot(formData: FormData) {
  const parsed = slotSchema.safeParse({ label: formData.get("label"), slotTime: formData.get("slotTime") });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Enter a label and time." };
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.from("time_slots").insert({
    label: parsed.data.label,
    slot_time: parsed.data.slotTime,
    sort_order: 0,
  });

  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That time slot already exists." : "Could not add time slot.",
    };
  }

  afterWrite();
  return { ok: true as const };
}

export async function toggleTimeSlot(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  const supabase = await requireAdmin();
  const { error } = await supabase.from("time_slots").update({ is_active: !isActive }).eq("id", id);

  if (error) return { ok: false as const, error: "Could not update time slot." };

  afterWrite();
  return { ok: true as const };
}

export async function deleteTimeSlot(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await requireAdmin();
  const { error } = await supabase.from("time_slots").delete().eq("id", id);

  if (error) return { ok: false as const, error: "Could not delete time slot." };

  afterWrite();
  return { ok: true as const };
}

const blockedDateSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date") });

export async function addBlockedDate(formData: FormData) {
  const parsed = blockedDateSchema.safeParse({ date: formData.get("date") });
  if (!parsed.success) {
    return { ok: false as const, error: "Choose a date." };
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.from("blocked_dates").insert({ date: parsed.data.date });

  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That date is already blocked." : "Could not block that date.",
    };
  }

  afterWrite();
  return { ok: true as const };
}

export async function removeBlockedDate(formData: FormData) {
  const date = String(formData.get("date"));
  const supabase = await requireAdmin();
  const { error } = await supabase.from("blocked_dates").delete().eq("date", date);

  if (error) return { ok: false as const, error: "Could not remove blocked date." };

  afterWrite();
  return { ok: true as const };
}
