import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppointmentPortal } from "@/components/appointment/appointment-portal";

export default async function Home() {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [{ data: timeSlots }, { data: blockedDates }] = await Promise.all([
    supabase.from("time_slots").select("*").eq("is_active", true).order("sort_order").order("slot_time"),
    supabase.from("blocked_dates").select("date").gte("date", todayIso),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-neutral-900">
            <Wrench className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <span className="text-lg font-bold">Mechanic On Call</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Workshop Login
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Book a Service Appointment</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Pick a date and time, tell us about your vehicle, and the workshop will confirm with you.
          </p>
        </div>
        <AppointmentPortal timeSlots={timeSlots ?? []} blockedDates={(blockedDates ?? []).map((b) => b.date)} />
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call
      </footer>
    </div>
  );
}
