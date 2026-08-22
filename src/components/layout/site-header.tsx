import Link from "next/link";
import { Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardHref = "/customer";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "mechanic") dashboardHref = "/mechanic";
    else if (profile?.role === "admin") dashboardHref = "/admin";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Wrench className="h-5 w-5 text-orange-500" />
          <span className="font-bold">Mechanic On Call</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
          <Link href="/#services" className="hover:text-white">Services</Link>
          <Link href="/mechanics" className="hover:text-white">Mechanics</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/about" className="hover:text-white">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href={dashboardHref}>
              <Button variant="primary" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
