"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SupportTicket } from "@/lib/supabase/types";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
  closed: "default",
};

export function SupportDesk({ userId, initialTickets }: { userId: string; initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: userId, subject, message })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit your ticket.");
      return;
    }
    setTickets((prev) => [data as SupportTicket, ...prev]);
    setSubject("");
    setMessage("");
    toast.success("Support ticket submitted");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <LifeBuoy className="h-4 w-4 text-brand-500" aria-hidden="true" /> Contact Support
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Describe your issue..."
              required
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
            <Button type="submit" variant="primary" disabled={submitting} className="self-start">
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-surface-2 p-0">
          {tickets.map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t.subject}</p>
                <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy, h:mm a")}</p>
            </div>
          ))}
          {tickets.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No support tickets yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
