"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wrench, User, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  { role: "customer", label: "Customer", email: "demo.customer@mechaniconcall.app", icon: User },
  { role: "mechanic", label: "Mechanic", email: "ahmed.khan@demo.mechaniconcall.app", icon: Wrench },
  { role: "admin", label: "Admin", email: "demo.admin@mechaniconcall.app", icon: ShieldCheck },
] as const;
const DEMO_PASSWORD = "DemoPass123!";
const EASE = [0.22, 1, 0.36, 1] as const;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function signInAndRedirect(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const next = params.get("next");
    if (next) {
      router.push(next);
    } else if (profile?.role === "mechanic") {
      router.push("/mechanic");
    } else if (profile?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/customer");
    }
    router.refresh();
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signInAndRedirect(email, password);
    setLoading(false);
  }

  async function handleDemoLogin(demoEmail: string, role: string) {
    setDemoLoading(role);
    await signInAndRedirect(demoEmail, DEMO_PASSWORD);
    setDemoLoading(null);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col items-center gap-1 p-6 pb-2 text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 text-orange-600">
            <Wrench className="h-6 w-6" aria-hidden="true" />
            <span className="text-lg font-bold text-neutral-900">Mechanic On Call</span>
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900">Welcome back</h1>
          <p className="text-sm text-neutral-500">Sign in to request or manage roadside assistance.</p>
        </div>

        <div className="p-6 pt-4">
          <div>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Quick demo login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ role, label, email: demoEmail, icon: Icon }, i) => (
                <motion.button
                  key={role}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.06, ease: EASE }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleDemoLogin(demoEmail, role)}
                  disabled={demoLoading !== null}
                  className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 py-3 text-xs font-medium text-neutral-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {demoLoading === role ? "..." : label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
            <div className="h-px flex-1 bg-neutral-200" /> or sign in <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Link href="/forgot-password" className="text-right text-xs text-orange-600 hover:underline">
              Forgot password?
            </Link>
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="group mt-2 w-full">
              {loading ? "Signing in..." : (
                <>
                  Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-orange-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
