"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Car, ShieldCheck, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName, phone } },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      setNeedsConfirmation(true);
      return;
    }

    window.location.href = role === "mechanic" ? "/mechanic" : "/customer";
  }

  if (needsConfirmation) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-600/20 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white p-6 text-center shadow-2xl shadow-black/40"
        >
          <ShieldCheck className="mx-auto h-10 w-10 text-sky-700" aria-hidden="true" />
          <h1 className="mt-3 font-heading text-lg font-bold text-neutral-900">Check your email</h1>
          <p className="mt-2 text-sm text-neutral-500">
            We&apos;ve sent a confirmation link to <span className="font-medium text-neutral-700">{email}</span>.
            Confirm your account, then sign in.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm font-medium text-sky-700 hover:underline">
            Go to login
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-600/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col items-center gap-1 p-6 pb-2 text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 text-sky-700">
            <Wrench className="h-6 w-6" aria-hidden="true" />
            <span className="font-heading text-lg font-bold text-neutral-900">Create an account</span>
          </Link>
          <p className="text-sm text-neutral-500">Join as a customer or a mechanic.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 px-6 pt-4">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
              role === "customer"
                ? "border-sky-700 bg-sky-50 text-sky-800"
                : "border-neutral-200 text-neutral-600 hover:border-sky-300"
            )}
          >
            <User className="h-5 w-5" aria-hidden="true" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("mechanic")}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
              role === "mechanic"
                ? "border-sky-700 bg-sky-50 text-sky-800"
                : "border-neutral-200 text-neutral-600 hover:border-sky-300"
            )}
          >
            <Car className="h-5 w-5" aria-hidden="true" />
            Mechanic
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-6 pt-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Full Name</label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
            <Input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
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
            <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" disabled={loading} className="group mt-2 w-full">
            {loading ? (
              "Creating account..."
            ) : (
              <>
                Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </Button>
          <p className="text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-sky-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </main>
  );
}
