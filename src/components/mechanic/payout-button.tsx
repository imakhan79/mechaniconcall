"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function PayoutButton({ mechanicId, amount }: { mechanicId: string; amount: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleRequest() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("payouts").insert({ mechanic_id: mechanicId, amount });
    setPending(false);
    if (error) {
      toast.error("Could not request payout.");
      return;
    }
    toast.success("Payout requested");
    router.refresh();
  }

  return (
    <Button variant="primary" disabled={pending || amount <= 0} onClick={handleRequest}>
      Request Payout
    </Button>
  );
}
