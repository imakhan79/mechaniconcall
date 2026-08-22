"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center pb-2">
          <Link href="/" className="mb-2 flex items-center gap-2 text-orange-600">
            <Wrench className="h-6 w-6" />
            <span className="font-bold text-lg text-neutral-900">Mechanic On Call</span>
          </Link>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We&apos;ll email you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              Check {email} for a password reset link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-neutral-500">
            <Link href="/login" className="font-medium text-orange-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
