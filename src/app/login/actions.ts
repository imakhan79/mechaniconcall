"use server";

import { createClient } from "@/lib/supabase/server";

export async function demoLogin() {
  const email = process.env.DEMO_LOGIN_EMAIL;
  const password = process.env.DEMO_LOGIN_PASSWORD;

  if (!email || !password) {
    return { ok: false as const, error: "Demo login is not configured." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
