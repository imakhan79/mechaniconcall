"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock, Wrench } from "lucide-react";
import { AppointmentCalendar } from "@/components/appointment/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { submitAppointment } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/supabase/types";

const EASE = [0.22, 1, 0.36, 1] as const;

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
  const [direction, setDirection] = useState(1);
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

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

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
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mx-auto w-full max-w-md"
      >
        <Card className="text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            >
              <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground">Appointment Requested</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve received your request. The workshop will call you to confirm.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-2 w-full rounded-lg bg-brand-500/10 p-4 text-left text-sm"
            >
              <Row label="Reference" value={`#${confirmed.id}`} />
              <Row label="Requested date" value={format(confirmed.date, "EEEE, d MMMM yyyy")} />
              <Row label="Requested time" value={confirmed.slot.label} />
            </motion.div>
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
      </motion.div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <ol className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <motion.span
              layout
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                i === step ? "bg-brand-500 text-white" : i < step ? "bg-border text-brand-600" : "bg-surface-2 text-muted-foreground"
              )}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {i + 1}
            </motion.span>
            <span className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {step === 0 && (
              <motion.div
                key="date"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-brand-500" aria-hidden="true" /> Select appointment date
                </h2>
                <AppointmentCalendar selectedDate={date} blockedDates={blockedSet} onSelect={setDate} />
                <Button className="mt-5 w-full" size="lg" variant="primary" disabled={!date} onClick={() => goTo(1)}>
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="time"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-brand-500" aria-hidden="true" /> Select appointment time
                </h2>
                <p className="mb-3 text-sm text-muted-foreground">{date && format(date, "EEEE, d MMMM yyyy")}</p>
                <motion.div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                >
                  {timeSlots.map((s) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
                      }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "min-h-12 cursor-pointer rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                        slot?.id === s.id
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-border text-foreground/90 hover:border-brand-400 hover:bg-brand-500/10"
                      )}
                    >
                      {s.label}
                    </motion.button>
                  ))}
                  {timeSlots.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground">No time slots are available right now.</p>
                  )}
                </motion.div>
                <div className="mt-5 flex gap-3">
                  <Button type="button" variant="outline" size="lg" onClick={() => goTo(0)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                  </Button>
                  <Button className="flex-1" size="lg" variant="primary" disabled={!slot} onClick={() => goTo(2)}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="details"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: EASE }}
              >
                <form onSubmit={handleSubmit(onSubmitDetails)} className="flex flex-col gap-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Wrench className="h-4 w-4 text-brand-500" aria-hidden="true" /> Vehicle & contact details
                  </h2>
                  <div className="rounded-lg bg-brand-500/10 p-3 text-sm text-muted-foreground">
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

                  {serverError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600"
                      role="alert"
                    >
                      {serverError}
                    </motion.p>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" size="lg" onClick={() => goTo(1)} disabled={pending}>
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
                    </Button>
                    <Button type="submit" className="flex-1" size="lg" variant="primary" disabled={pending}>
                      {pending ? "Submitting..." : "Submit Appointment Request"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

const stepVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -24 : 24 }),
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground/90">{label}</label>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </motion.p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
