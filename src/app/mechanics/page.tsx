import { Star, ShieldCheck, Wrench, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export const metadata = { title: "Verified Mechanics | Mechanic On Call" };

export default async function MechanicsPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, bio, specialties, rating_avg, rating_count, verification_status, is_online, service_radius_km")
    .eq("verification_status", "verified")
    .order("rating_avg", { ascending: false });

  const ids = (mechanics ?? []).map((m) => m.id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/15 px-3 py-1 text-xs font-medium text-orange-400 ring-1 ring-orange-600/30">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Background-checked & document-verified
            </span>
            <h1 className="mt-4 text-3xl font-bold md:text-5xl">Our Verified Mechanics</h1>
            <p className="mx-auto mt-3 max-w-xl text-neutral-300">
              Every mechanic on Mechanic On Call passes ID, license, and certification review before they can accept a single job.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(mechanics ?? []).map((m) => (
            <StaggerItem key={m.id}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
                        {(nameOf.get(m.id) ?? m.business_name ?? "M").charAt(0)}
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">{nameOf.get(m.id) ?? m.business_name}</p>
                        <p className="text-xs text-neutral-500">{m.business_name}</p>
                      </div>
                    </div>
                    {m.is_online && <Badge variant="success">Online</Badge>}
                  </div>

                  <p className="line-clamp-2 text-sm text-neutral-600">{m.bio ?? "Experienced roadside mechanic."}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {m.specialties.slice(0, 4).map((s: string) => (
                      <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{s}</span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                    <span className="flex items-center gap-1 font-semibold text-neutral-800">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" /> {Number(m.rating_avg).toFixed(1)}
                      <span className="font-normal text-neutral-400">({m.rating_count})</span>
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {m.service_radius_km} km radius
                    </span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        {(mechanics ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-neutral-400">
            <Wrench className="h-8 w-8" aria-hidden="true" />
            <p>No verified mechanics yet — check back soon.</p>
          </div>
        )}
      </section>

      <footer className="mt-auto bg-neutral-950 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call. Roadside help, wherever you are.
      </footer>
    </div>
  );
}
