import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AppointmentPortal } from "@/components/appointment/appointment-portal";
import { FadeIn } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "Book a Service Appointment — Mechanic On Call",
};

export default async function BookPage() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [{ data: timeSlots }, { data: blockedDates }] = await Promise.all([
    supabase.from("time_slots").select("*").eq("is_active", true).order("sort_order").order("slot_time"),
    supabase.from("blocked_dates").select("date").gte("date", todayIso),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <FadeIn className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Book a Service Appointment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a date and time, tell us about your vehicle, and the workshop will confirm with you.
          </p>
        </FadeIn>
        <FadeIn delay={0.1} className="w-full">
          <AppointmentPortal timeSlots={timeSlots ?? []} blockedDates={(blockedDates ?? []).map((b) => b.date)} />
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  );
}
