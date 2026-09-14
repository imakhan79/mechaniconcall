"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminUpdateTicketStatus } from "@/app/admin/actions";
import type { SupportTicket, SupportTicketStatus } from "@/lib/supabase/types";

type AdminTicket = SupportTicket & { user_name: string };

const STATUS_OPTIONS: SupportTicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

export function SupportQueue({ tickets }: { tickets: AdminTicket[] }) {
  const [items, setItems] = useState(tickets);
  const [pending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: SupportTicketStatus) {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => {
      const res = await adminUpdateTicketStatus(id, status);
      if (res.ok) toast.success("Ticket updated");
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="divide-y divide-surface-2 p-0">
        {items.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{t.subject}</p>
                <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.user_name} · {format(new Date(t.created_at), "d MMM yyyy, h:mm a")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
            </div>
            <select
              value={t.status}
              disabled={pending}
              onChange={(e) => handleStatusChange(t.id, e.target.value as SupportTicketStatus)}
              className="h-9 shrink-0 rounded-lg border border-border bg-surface-2 px-2 text-xs capitalize text-foreground"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        ))}
        {items.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No support tickets.</p>}
      </CardContent>
    </Card>
  );
}
