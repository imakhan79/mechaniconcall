"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock, Wrench } from "lucide-react";
import { AppointmentCalendar } from "@/components/appointment/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { submitAppointment } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/supabase/types";

const detailsSchema = z.object({
  carNumber: z.string().trim().min(2, "Enter the car registration number").max(20, "Too long"),
  ownerName: z.string().trim().min(2, "Enter the owner's name").max(80, "Too long"),
  ownerMobile: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid mobile number"),
});
type DetailsForm = z.infer<typeof detailsSchema>;

const STEPS = ["Date", "Time", "Details"] as const;

export function AppointmentPortal({
  timeSlots,
  blockedDates,
}: {
  timeSlots: TimeSlot[];
  blockedDates: string[];
}) {
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ id: number; date: Date; slot: TimeSlot } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema) });

  function onSubmitDetails(values: DetailsForm) {
    if (!date || !slot) return;
    setServerError(null);
    const formData = new FormData();
    formData.set("carNumber", values.carNumber);
    formData.set("ownerName", values.ownerName);
    formData.set("ownerMobile", values.ownerMobile);
    formData.set("requestedDate", format(date, "yyyy-MM-dd"));
    formData.set("requestedTime", slot.slot_time);

    startTransition(async () => {
      const result = await submitAppointment(formData);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setConfirmed({ id: result.id, date, slot });
    });
  }

  if (confirmed) {
    return (
      <Card className="mx-auto w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-neutral-900">Appointment Requested</h2>
          <p className="text-sm text-neutral-500">
            We&apos;ve received your request. The workshop will call you to confirm.
          </p>
          <div className="mt-2 w-full rounded-lg bg-neutral-50 p-4 text-left text-sm">
            <Row label="Reference" value={`#${confirmed.id}`} />
            <Row label="Requested date" value={format(confirmed.date, "EEEE, d MMMM yyyy")} />
            <Row label="Requested time" value={confirmed.slot.label} />
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setConfirmed(null);
              setDate(null);
              setSlot(null);
              setStep(0);
            }}
          >
            Book another appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <ol className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i === step ? "bg-orange-600 text-white" : i < step ? "bg-orange-100 text-orange-700" : "bg-neutral-100 text-neutral-400"
              )}
            >
              {i + 1}
            </span>
            <span className={cn("text-xs font-medium", i === step ? "text-neutral-900" : "text-neutral-400")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-neutral-200" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="p-5">
          {step === 0 && (
            <>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-900">
                <CalendarDays className="h-4 w-4 text-orange-600" aria-hidden="true" /> Select appointment date
              </h2>
              <AppointmentCalendar selectedDate={date} blockedDates={blockedSet} onSelect={setDate} />
              <Button className="mt-5 w-full" size="lg" variant="primary" disabled={!date} onClick={() => setStep(1)}>
                Continue
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-900">
                <Clock className="h-4 w-4 text-orange-600" aria-hidden="true" /> Select appointment time
              </h2>
              <p className="mb-3 text-sm text-neutral-500">{date && format(date, "EEEE, d MMMM yyyy")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {timeSlots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={cn(
                      "min-h-12 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                      slot?.id === s.id
                        ? "border-orange-600 bg-orange-600 text-white"
                        : "border-neutral-200 text-neutral-700 hover:border-orange-300 hover:bg-orange-50"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
                {timeSlots.length === 0 && (
                  <p className="col-span-full text-sm text-neutral-400">No time slots are available right now.</p>
                )}
              </div>
              <div className="mt-5 flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                </Button>
                <Button className="flex-1" size="lg" variant="primary" disabled={!slot} onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmitDetails)} className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
                <Wrench className="h-4 w-4 text-orange-600" aria-hidden="true" /> Vehicle & contact details
              </h2>
              <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                {date && format(date, "EEEE, d MMMM yyyy")} · {slot?.label}
              </div>

              <Field label="Car / Registration Number" error={errors.carNumber?.message}>
                <Input placeholder="e.g. ABC-123" {...register("carNumber")} />
              </Field>
              <Field label="Owner Name" error={errors.ownerName?.message}>
                <Input placeholder="Full name" {...register("ownerName")} />
              </Field>
              <Field label="Owner Mobile Number" error={errors.ownerMobile?.message}>
                <Input type="tel" placeholder="e.g. 0300 1234567" {...register("ownerMobile")} />
              </Field>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} disabled={pending}>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                </Button>
                <Button type="submit" className="flex-1" size="lg" variant="primary" disabled={pending}>
                  {pending ? "Submitting..." : "Submit Appointment Request"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}
