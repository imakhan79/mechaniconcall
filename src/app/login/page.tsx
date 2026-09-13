"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center gap-1 p-6 pb-2 text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 text-orange-600">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <span className="text-lg font-bold text-neutral-900">Workshop Login</span>
          </Link>
          <p className="text-sm text-neutral-500">Sign in to review and manage appointment requests.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-6 pt-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
            <Input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@workshop.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={loading} className="group mt-2 w-full">
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
