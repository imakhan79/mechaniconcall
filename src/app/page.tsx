import Link from "next/link";
import { Battery, Car, CheckCircle2, Clock, Gauge, ShieldCheck, Star, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { cn } from "@/lib/utils";

const services = [
  {
    icon: Wrench,
    title: "General Maintenance",
    description: "Oil changes, filters, fluid top-ups, and scheduled service to keep your car running smoothly.",
  },
  {
    icon: Gauge,
    title: "Diagnostics & Repair",
    description: "Engine and warning-light diagnostics with clear, upfront explanations before any work begins.",
  },
  {
    icon: Car,
    title: "Tires & Brakes",
    description: "Tire rotation, alignment, and brake inspection or replacement for safer, smoother driving.",
  },
  {
    icon: Battery,
    title: "Battery & Electrical",
    description: "Battery testing and replacement plus electrical system checks to prevent breakdowns.",
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: "Certified Mechanics",
    description: "Every job is handled by experienced, certified technicians you can trust.",
  },
  {
    icon: Clock,
    title: "Fast Confirmation",
    description: "Submit a request and the workshop confirms your slot quickly — no waiting on hold.",
  },
  {
    icon: Star,
    title: "Trusted by Drivers",
    description: "A straightforward booking experience built around clear pricing and honest service.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
          <FadeIn>
            <h1 className="font-heading text-3xl font-bold text-neutral-900 sm:text-5xl">
              Reliable Vehicle Service, On Your Schedule
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mx-auto mt-4 max-w-xl text-base text-neutral-500 sm:text-lg">
              Pick a date and time, tell us about your vehicle, and our workshop will confirm your appointment —
              no phone calls, no waiting.
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/book" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
              Book Appointment
            </Link>
            <Link href="#services" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              View Services
            </Link>
          </FadeIn>
        </section>

        <section id="services" className="border-t border-sky-100 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">Our Services</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Everything your vehicle needs, handled by one trusted workshop.
              </p>
            </FadeIn>

            <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, title, description }) => (
                <StaggerItem key={title}>
                  <Card className="h-full">
                    <CardContent className="flex h-full flex-col gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="font-heading text-base font-semibold text-neutral-900">{title}</h3>
                      <p className="text-sm text-neutral-500">{description}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">Why Choose Us</h2>
            </FadeIn>

            <Stagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {reasons.map(({ icon: Icon, title, description }) => (
                <StaggerItem key={title} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-neutral-900">{title}</h3>
                  <p className="max-w-xs text-sm text-neutral-500">{description}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section className="border-t border-sky-100 bg-white py-16 sm:py-20">
          <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center">
            <div className="flex items-center gap-1.5 text-sm font-medium text-sky-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> No calls, no hassle
            </div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
              Ready to get your car serviced?
            </h2>
            <p className="text-sm text-neutral-500">
              Book an appointment in minutes and we&apos;ll confirm the details with you.
            </p>
            <Link href="/book" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2")}>
              Book Appointment
            </Link>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
