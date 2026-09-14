import { AlertTriangle, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";
import { formatAED } from "@/lib/currency";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("service_categories").select("*").order("name");

  return (
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <FadeIn className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Pricing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Starting prices for common services — final cost depends on your vehicle and issue.
          </p>
        </FadeIn>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c) => (
            <StaggerItem key={c.id}>
              <Card>
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                    {c.is_emergency ? <AlertTriangle className="h-5 w-5" aria-hidden="true" /> : <Wrench className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">from {formatAED(c.base_price)}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </main>
      <SiteFooter />
    </div>
  );
}
