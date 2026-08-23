import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/home/hero";
import { ServicesGrid } from "@/components/home/services-grid";
import { TrustStats } from "@/components/home/trust-stats";

export default async function Home() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("*")
    .order("sort_order");

  const { data: mechanics } = await supabase
    .from("mechanics")
    .select("id, business_name, current_lat, current_lng, is_online, rating_avg")
    .eq("is_online", true)
    .limit(20);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <Hero mechanics={mechanics ?? []} />
      <ServicesGrid categories={categories ?? []} />
      <TrustStats />
      <footer className="mt-auto bg-neutral-950 py-8 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} Mechanic On Call. Roadside help, wherever you are.
      </footer>
    </div>
  );
}
