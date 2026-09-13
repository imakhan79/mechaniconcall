"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
    </button>
  );
}
