import { createClient } from "@/lib/supabase/server";
import { SettingsManager } from "@/components/admin/settings-manager";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: timeSlots }, { data: blockedDates }] = await Promise.all([
    supabase.from("time_slots").select("*").order("sort_order").order("slot_time"),
    supabase.from("blocked_dates").select("*").order("date"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-foreground">Workshop Settings</h1>
      <SettingsManager timeSlots={timeSlots ?? []} blockedDates={blockedDates ?? []} />
    </div>
  );
}
