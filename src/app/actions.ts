"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  carNumber: z.string().trim().min(2, "Enter the car registration number").max(20, "Too long"),
  ownerName: z.string().trim().min(2, "Enter the owner's name").max(80, "Too long"),
  ownerMobile: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid mobile number"),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  requestedTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time"),
});

export async function submitAppointment(formData: FormData) {
  const parsed = schema.safeParse({
    carNumber: formData.get("carNumber"),
    ownerName: formData.get("ownerName"),
    ownerMobile: formData.get("ownerMobile"),
    requestedDate: formData.get("requestedDate"),
    requestedTime: formData.get("requestedTime"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Please check the details and try again." };
  }

  const today = startOfToday();
  const requested = new Date(`${parsed.data.requestedDate}T00:00:00`);
  if (requested < today) {
    return { ok: false as const, error: "Please choose a valid, upcoming date." };
  }

  const supabase = await createClient();
  const { data: newId, error } = await supabase.rpc("request_appointment", {
    p_car_number: parsed.data.carNumber.toUpperCase(),
    p_owner_name: parsed.data.ownerName,
    p_owner_mobile: parsed.data.ownerMobile,
    p_requested_date: parsed.data.requestedDate,
    p_requested_time: parsed.data.requestedTime,
  });

  if (error || newId == null) {
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }

  return { ok: true as const, id: newId as number };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
