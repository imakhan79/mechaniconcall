import { ShieldCheck, MapPin, Clock, Wallet, Heart, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { TrustStats } from "@/components/home/trust-stats";

export const metadata = { title: "About Us | Mechanic On Call" };

const VALUES = [
  { icon: ShieldCheck, title: "Trust first", desc: "Every mechanic is document-verified before they can accept a job — no exceptions." },
  { icon: MapPin, title: "Wherever you are", desc: "Highway, home, or a dark parking lot — we dispatch to your exact live location." },
  { icon: Clock, title: "Every minute counts", desc: "Our matching engine ranks mechanics by distance, availability and rating in real time." },
  { icon: Wallet, title: "No surprises", desc: "You see a price range before you request, and approve every itemized estimate before work starts." },
];

const STEPS = [
  { step: "01", title: "Share your location", desc: "Use GPS or drop a pin — we find mechanics within your service radius instantly." },
  { step: "02", title: "Get matched", desc: "We rank nearby verified mechanics by distance, rating and expertise for your problem." },
  { step: "03", title: "Track live", desc: "Watch your mechanic's ETA update in real time, and chat or call directly." },
  { step: "04", title: "Pay with confidence", desc: "Approve the itemized estimate, pay your way, then rate your experience." },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/15 px-3 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-600/30">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" /> Our mission
            </span>
            <h1 className="mt-4 text-3xl font-bold md:text-5xl">
              Nobody should feel stranded.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-neutral-300">
              Mechanic On Call connects drivers with trusted, verified mechanics in minutes —
              so a breakdown is a delay, not a crisis.
            </p>
          </FadeIn>
        </div>
      </section>

      <TrustStats />

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <FadeIn>
          <h2 className="text-center text-2xl font-bold text-neutral-900">How it works</h2>
        </FadeIn>
        <Stagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <StaggerItem key={s.step}>
              <div className="relative rounded-xl border border-neutral-200 bg-white p-5">
                <span className="text-3xl font-bold text-orange-100">{s.step}</span>
                <p className="mt-1 font-semibold text-neutral-900">{s.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{s.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-neutral-900">What we stand for</h2>
          </FadeIn>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">{title}</p>
                    <p className="mt-0.5 text-sm text-neutral-500">{desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <Wrench className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="max-w-lg text-neutral-600">
          Built for the moment your car won&apos;t start — by people who&apos;ve been there.
        </p>
      </section>

      <footer className="mt-auto bg-neutral-950 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call. Roadside help, wherever you are.
      </footer>
    </div>
  );
}
