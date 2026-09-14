import Link from "next/link";
import Image from "next/image";
import {
  Battery,
  CheckCircle2,
  Clock3,
  Disc3,
  Fuel,
  Gauge,
  Home as HomeIcon,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Signal,
  ShieldCheck,
  Snowflake,
  Star,
  Timer,
  Truck,
  User,
  Wifi,
  Wind,
  Wrench,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem, PulseDot, RouteLine, AnimatedCounter } from "@/components/motion/reveal";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { cn } from "@/lib/utils";

const services = [
  { icon: Battery, title: "Battery Jump Start", price: "from AED 80", desc: "Dead battery? A mechanic comes to you and gets you started in minutes." },
  { icon: Disc3, title: "Flat Tire Repair", price: "from AED 90", desc: "Roadside tire change or repair, wherever you're stranded." },
  { icon: Truck, title: "Towing Assistance", price: "from AED 150", desc: "Fast, insured towing when your vehicle can't be fixed on the spot." },
  { icon: Fuel, title: "Emergency Fuel Delivery", price: "from AED 60", desc: "Ran out of fuel? We deliver enough to get you to the nearest station." },
  { icon: Gauge, title: "Engine Diagnostics", price: "from AED 120", desc: "Warning light on? Get a clear, upfront diagnosis before any repair." },
  { icon: Disc3, title: "Brake Repair", price: "from AED 140", desc: "Certified brake inspection and repair for safer stopping power." },
  { icon: Wind, title: "Engine Repair", price: "from AED 250", desc: "General mechanical repair handled by experienced technicians." },
  { icon: Snowflake, title: "AC Repair", price: "from AED 130", desc: "Beat the heat — AC diagnostics and recharge at your location." },
];

const steps = [
  { icon: MapPin, title: "Request Help", desc: "Share your location and describe the issue in under a minute." },
  { icon: Wrench, title: "Match With a Mechanic", desc: "A verified, nearby mechanic accepts your request instantly." },
  { icon: Navigation, title: "Track Arrival", desc: "Watch your mechanic's live location and ETA on the map." },
  { icon: CheckCircle2, title: "Back on the Road", desc: "Approve the estimate, get it fixed, and pay securely." },
];

const reasons = [
  { icon: ShieldCheck, title: "Verified Mechanics", desc: "Every mechanic is background-checked and document-verified before going live." },
  { icon: Timer, title: "Fast Response", desc: "Most requests are matched with a nearby mechanic in minutes, not hours." },
  { icon: Gauge, title: "Upfront Estimates", desc: "Clear pricing before any work begins — no surprise charges." },
  { icon: Star, title: "Rated & Reviewed", desc: "Real ratings from real customers after every completed job." },
];

const testimonials = [
  { name: "Fatima R.", vehicle: "Toyota Land Cruiser", rating: 5, review: "Battery died at 11pm on Sheikh Zayed Road. A mechanic was there in 18 minutes. Incredible service." },
  { name: "Omar A.", vehicle: "Nissan Patrol", rating: 5, review: "Transparent pricing, live tracking, and the mechanic was genuinely professional. Will use again." },
  { name: "Sara K.", vehicle: "Honda Civic", rating: 5, review: "Flat tire on the highway and I was back on the road in under 30 minutes. Highly recommend." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-dubai-skyline.jpg"
              alt="Dubai skyline and highway interchange at night, with the Burj Khalifa"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-[0.28]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(142,214,0,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(245,158,11,0.10), transparent 40%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2">
            <div>
              <FadeIn className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                <PulseDot /> Live across Dubai, Abu Dhabi & Sharjah
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="font-heading mt-5 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
                  A Trusted Mechanic, <span className="text-brand-500">Wherever You Need One.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
                  Professional roadside assistance and vehicle repair, dispatched to your location anywhere in the UAE — fast,
                  transparent, and reliable.
                </p>
              </FadeIn>
              <FadeIn delay={0.24} className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/request" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
                  Get a Mechanic Now
                </Link>
                <Link href="/#services" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Explore Services
                </Link>
              </FadeIn>
              <FadeIn delay={0.32} className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {["Verified Mechanics", "Transparent AED Pricing", "Real-Time Tracking", "24/7 Assistance"].map((label) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </FadeIn>
            </div>

            <FadeIn delay={0.2} className="relative">
              <div className="relative rounded-3xl border border-border bg-surface p-6 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <PulseDot /> Live tracking
                  </span>
                  <span className="text-muted-foreground">ETA 8 min</span>
                </div>
                <div className="relative mt-4 h-56 overflow-hidden rounded-2xl border border-border bg-surface-2">
                  <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-[0.15]">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 25} x2="200" y2={i * 25} stroke="var(--border)" strokeWidth="1" />
                    ))}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="200" stroke="var(--border)" strokeWidth="1" />
                    ))}
                  </svg>
                  <RouteLine className="absolute left-1/2 top-1/2 h-10 w-40 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute left-[18%] top-[60%] flex flex-col items-center">
                    <MapPin className="h-6 w-6 text-brand-500 drop-shadow" fill="currentColor" />
                    <span className="mt-1 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground">You</span>
                  </div>
                  <div className="absolute right-[18%] top-[30%] flex flex-col items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-background">
                      <Wrench className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground">Mechanic</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ahmed Khan</p>
                    <p className="text-xs text-muted-foreground">⭐ 4.9 · Battery Jump Start</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-t border-border py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto mb-8 max-w-3xl overflow-hidden rounded-2xl border border-border">
              <Image
                src="/images/mechanic-workshop.jpg"
                alt="Professional mechanic working in a service bay"
                width={1200}
                height={360}
                className="h-32 w-full object-cover sm:h-44"
              />
            </div>
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Our Services</h2>
              <p className="mt-2 text-sm text-muted-foreground">Everything your vehicle needs, dispatched directly to your location.</p>
            </FadeIn>

            <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, title, price, desc }) => (
                <StaggerItem key={title}>
                  <Link href="/request" className="block h-full">
                    <Card className="h-full transition-transform hover:-translate-y-1 hover:border-brand-500/40">
                      <CardContent className="flex h-full flex-col gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                        <p className="flex-1 text-sm text-muted-foreground">{desc}</p>
                        <span className="text-xs font-semibold text-brand-400">{price}</span>
                      </CardContent>
                    </Card>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border bg-surface/40 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">How It Works</h2>
              <p className="mt-2 text-sm text-muted-foreground">From request to repair in four simple steps.</p>
            </FadeIn>

            <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-5">
              <Stagger className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-3">
                {steps.map(({ icon: Icon, title, desc }, i) => (
                  <StaggerItem key={title} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/40 bg-background text-brand-500">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="mt-3 text-xs font-semibold text-brand-400">0{i + 1}</span>
                    <h3 className="font-heading mt-1 text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 max-w-[220px] text-sm text-muted-foreground">{desc}</p>
                  </StaggerItem>
                ))}
              </Stagger>

              <FadeIn delay={0.1} className="relative overflow-hidden rounded-2xl border border-border lg:col-span-2">
                <Image
                  src="/images/mechanic-engine-repair.jpg"
                  alt="Mechanic repairing a car engine at a customer's location"
                  width={640}
                  height={720}
                  className="h-72 w-full object-cover lg:h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Why choose us */}
        <section id="safety" className="border-t border-border py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Why Choose Us</h2>
              <p className="mt-2 text-sm text-muted-foreground">Safety and trust, built into every step of the experience.</p>
            </FadeIn>

            <Stagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {reasons.map(({ icon: Icon, title, desc }) => (
                <StaggerItem key={title}>
                  <Card className="h-full">
                    <CardContent className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <FadeIn className="relative mt-12 overflow-hidden rounded-2xl border border-border">
              <Image
                src="/images/uae-street-traffic.jpg"
                alt="Street traffic in the UAE with residential towers"
                width={1600}
                height={500}
                className="h-40 w-full object-cover sm:h-56"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="relative grid grid-cols-2 gap-6 p-8 text-center sm:grid-cols-4">
                {[
                  { value: 4200, suffix: "+", label: "Jobs completed" },
                  { value: 350, suffix: "+", label: "Verified mechanics" },
                  { value: 18, suffix: " min", label: "Avg. response" },
                  { value: 4.9, suffix: "/5", label: "Average rating" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-heading text-2xl font-bold text-brand-500 sm:text-3xl">
                      {Number.isInteger(stat.value) ? (
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      ) : (
                        `${stat.value}${stat.suffix}`
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Mobile app */}
        <section className="border-t border-border py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <FadeIn>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Mechanic On Call, <span className="text-brand-500">right in your pocket.</span>
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
                Request help, track your mechanic&apos;s live location, chat, and pay — all from one clean,
                fast mobile experience built for roadside emergencies.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "One-tap emergency requests with live GPS",
                  "Real-time chat and call with your mechanic",
                  "Secure in-app payments — Cash, Card or PayIt",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/request" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-7")}>
                Try It Now
              </Link>
            </FadeIn>

            <FadeIn delay={0.15} className="flex justify-center">
              <div className="relative w-[260px] rounded-[2.5rem] border-[6px] border-surface-2 bg-background p-2 shadow-2xl shadow-black/50 ring-1 ring-border">
                <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-surface-2" />
                <div className="relative overflow-hidden rounded-[1.9rem] bg-surface">
                  <div className="flex items-center justify-between px-5 pb-1 pt-3 text-[10px] text-muted-foreground">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <Signal className="h-3 w-3" />
                      <Wifi className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="px-4 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm font-bold text-foreground">Mechanic On Call</span>
                      <PulseDot />
                    </div>

                    <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground">Mechanic en route</span>
                        <span className="text-brand-400">6 min</span>
                      </div>
                      <div className="relative mt-2 h-24 overflow-hidden rounded-lg bg-background">
                        <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full opacity-[0.15]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <line key={i} x1="0" y1={i * 25} x2="200" y2={i * 25} stroke="var(--border)" strokeWidth="1" />
                          ))}
                        </svg>
                        <RouteLine className="absolute left-1/2 top-1/2 h-8 w-32 -translate-x-1/2 -translate-y-1/2" />
                        <MapPin className="absolute left-[20%] top-[55%] h-4 w-4 text-brand-500" fill="currentColor" />
                        <span className="absolute right-[18%] top-[30%] flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                          <Wrench className="h-2.5 w-2.5 text-background" />
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      {["Battery Jump Start", "Flat Tire Repair"].map((s) => (
                        <div key={s} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[11px] text-foreground/90">
                          {s} <span className="text-brand-400">AED {s === "Battery Jump Start" ? "80" : "90"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-around border-t border-border py-3 text-muted-foreground">
                    <HomeIcon className="h-4 w-4 text-brand-500" />
                    <MapPin className="h-4 w-4" />
                    <MessageSquare className="h-4 w-4" />
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-t border-border bg-surface/40 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <FadeIn className="mx-auto max-w-xl text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Trusted by Drivers Across the UAE</h2>
            </FadeIn>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
              <FadeIn delay={0.1} className="relative hidden overflow-hidden rounded-2xl border border-border lg:col-span-2 lg:block">
                <Image
                  src="/images/emirati-customer.jpg"
                  alt="Customer beside their 4x4 at sunset in the UAE"
                  width={640}
                  height={800}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              </FadeIn>

              <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
                {testimonials.map((t) => (
                  <StaggerItem key={t.name}>
                    <Card className="h-full">
                      <CardContent className="flex h-full flex-col gap-3">
                        <div className="flex gap-0.5 text-warning">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-warning" />
                          ))}
                        </div>
                        <p className="flex-1 text-sm text-foreground/90">&ldquo;{t.review}&rdquo;</p>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.vehicle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-border py-16 sm:py-20">
          <Image
            src="/images/dune-4x4.jpg"
            alt="4x4 vehicle on a desert dune in the UAE"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-[0.18]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background" />
          <FadeIn className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center">
            <div className="flex items-center gap-1.5 text-sm font-medium text-brand-400">
              <Clock3 className="h-4 w-4" aria-hidden="true" /> Available 24/7, every day of the year across the UAE
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Don&apos;t Let a Breakdown Stop Your Journey.
            </h2>
            <p className="text-sm text-muted-foreground">
              Request a verified mechanic in minutes and get back on the road with confidence.
            </p>
            <Link href="/request" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2")}>
              Request a Mechanic
            </Link>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
