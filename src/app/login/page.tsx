"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench, User, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DEMO_ACCOUNTS = [
  { role: "customer", label: "Customer", email: "demo.customer@mechaniconcall.app", icon: User },
  { role: "mechanic", label: "Mechanic", email: "ahmed.khan@demo.mechaniconcall.app", icon: Wrench },
  { role: "admin", label: "Admin", email: "demo.admin@mechaniconcall.app", icon: ShieldCheck },
] as const;
const DEMO_PASSWORD = "DemoPass123!";

export default function LoginPage() {
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
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center pb-2">
          <Link href="/" className="mb-2 flex items-center gap-2 text-orange-600">
            <Wrench className="h-6 w-6" />
            <span className="font-bold text-lg text-neutral-900">Mechanic On Call</span>
          </Link>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to request or manage roadside assistance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Quick demo login
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(({ role, label, email: demoEmail, icon: Icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDemoLogin(demoEmail, role)}
                  disabled={demoLoading !== null}
                  className="flex flex-col items-center gap-1 rounded-lg border border-neutral-200 py-3 text-xs font-medium text-neutral-700 hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4" />
                  {demoLoading === role ? "..." : label}
                </button>
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
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-orange-600 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
