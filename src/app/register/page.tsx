"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Role = "customer" | "mechanic";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, phone } },
    });

    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Could not create account");
      return;
    }

    // profiles/customers/mechanics rows are provisioned server-side by the
    // handle_new_user trigger (supabase/migrations/0004_auth_trigger.sql)
    setLoading(false);

    if (!data.session) {
      toast.success("Account created — check your email to confirm before signing in.");
      router.push("/login");
      return;
    }

    toast.success("Account created!");
    router.push(role === "mechanic" ? "/mechanic/verification" : "/customer");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center pb-2">
          <Link href="/" className="mb-2 flex items-center gap-2 text-orange-600">
            <Wrench className="h-6 w-6" />
            <span className="font-bold text-lg text-neutral-900">Mechanic On Call</span>
          </Link>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Get roadside help fast, or start earning as a mechanic.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`rounded-md py-1.5 text-sm font-medium transition ${role === "customer" ? "bg-white shadow-sm" : "text-neutral-500"}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("mechanic")}
              className={`rounded-md py-1.5 text-sm font-medium transition ${role === "mechanic" ? "bg-white shadow-sm" : "text-neutral-500"}`}
            >
              Mechanic
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Full name</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ahmed Khan" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Phone</label>
              <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Password</label>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? "Creating account..." : `Create ${role === "mechanic" ? "Mechanic" : "Customer"} Account`}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-orange-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
