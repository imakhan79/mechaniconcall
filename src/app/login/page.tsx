"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoLogin, customerDemoLogin, mechanicDemoLogin } from "@/app/login/actions";

const EASE = [0.22, 1, 0.36, 1] as const;

async function resolveDestination(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: adminRow } = await supabase.from("workshop_admins").select("id").eq("id", userId).maybeSingle();
  if (adminRow) return "/admin";

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role === "mechanic") return "/mechanic";
  if (profile?.role === "customer") return "/customer";

  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"admin" | "customer" | "mechanic" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const destination = await resolveDestination(supabase, data.user.id);
    setLoading(false);
    router.push(destination);
    router.refresh();
  }

  async function handleDemoLogin() {
    setDemoLoading("admin");
    const result = await demoLogin();
    setDemoLoading(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleCustomerDemoLogin() {
    setDemoLoading("customer");
    const result = await customerDemoLogin();
    setDemoLoading(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    router.push("/customer");
    router.refresh();
  }

  async function handleMechanicDemoLogin() {
    setDemoLoading("mechanic");
    const result = await mechanicDemoLogin();
    setDemoLoading(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    router.push("/mechanic");
    router.refresh();
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10"
      suppressHydrationWarning
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-success/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-surface shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col items-center gap-1 p-6 pb-2 text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 text-brand-500">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <span className="font-heading text-lg font-bold text-foreground">Sign In</span>
          </Link>
          <p className="text-sm text-muted-foreground">Customers, mechanics, and the workshop all sign in here.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-6 pt-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">Email</label>
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">Password</label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={loading || !!demoLoading} className="group mt-2 w-full">
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-medium text-brand-500 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            One-click demo access
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              disabled={!!demoLoading || loading}
              onClick={handleCustomerDemoLogin}
              className="w-full"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {demoLoading === "customer" ? "Signing in..." : "Customer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!demoLoading || loading}
              onClick={handleMechanicDemoLogin}
              className="w-full"
            >
              <Wrench className="h-4 w-4" aria-hidden="true" />
              {demoLoading === "mechanic" ? "Signing in..." : "Mechanic"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!demoLoading || loading}
              onClick={handleDemoLogin}
              className="w-full"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {demoLoading === "admin" ? "Signing in..." : "Admin"}
            </Button>
          </div>
        </form>
      </motion.div>
    </main>
  );
}
