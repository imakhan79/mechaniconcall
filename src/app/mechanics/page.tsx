import { Star, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

export default async function MechanicsDirectoryPage() {
  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("*, profile:profiles(*)")
    .eq("verification_status", "verified")
    .order("rating_avg", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <FadeIn className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">Our Mechanics</h1>
          <p className="mt-2 text-sm text-neutral-500">Verified, trusted mechanics ready to help.</p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(mechanics ?? []).map((m) => {
            const profile = m.profile as unknown as { full_name: string } | null;
            return (
              <StaggerItem key={m.id}>
                <Card>
                  <CardContent className="flex flex-col gap-2 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                        <Wrench className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-semibold text-neutral-900">
                          {m.business_name || profile?.full_name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-neutral-500">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                          {Number(m.rating_avg).toFixed(1)} ({m.rating_count})
                        </p>
                      </div>
                    </div>
                    {m.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.specialties.map((s: string) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Badge variant={m.is_online ? "success" : "default"} className="w-fit">
                      {m.is_online ? "Online now" : "Offline"}
                    </Badge>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
          {(!mechanics || mechanics.length === 0) && (
            <p className="col-span-full text-center text-sm text-neutral-400">No verified mechanics yet — check back soon.</p>
          )}
        </Stagger>
      </main>
      <SiteFooter />
    </div>
  );
}
