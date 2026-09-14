"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/supabase/types";

export function ChatPanel({ requestId, userId }: { requestId: number; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function setup() {
      const { data } = await supabase.from("messages").select("*").eq("request_id", requestId).order("created_at");
      if (!cancelled) setMessages(data ?? []);

      // Ensure the session (and therefore Realtime's auth token) is fully
      // loaded before subscribing — subscribing too early leaves the socket
      // unauthenticated, so RLS silently blocks every event on this channel.
      await supabase.auth.getSession();
      if (cancelled) return;

      channel = supabase
        .channel(`messages-${requestId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
          (payload) => setMessages((prev) => [...prev, payload.new as Message])
        )
        .subscribe();
    }
    setup();

    return () => {
      cancelled = true;
      if (!channel) return;
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .insert({ request_id: requestId, sender_id: userId, body: body.trim() });
    setSending(false);
    if (!error) setBody("");
  }

  return (
    <div className="flex h-80 flex-col rounded-xl border border-border bg-surface">
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && <p className="p-2 text-center text-sm text-muted-foreground">No messages yet.</p>}
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  mine ? "self-end bg-brand-500 text-white" : "self-start bg-surface-2 text-foreground"
                )}
              >
                {m.body}
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-surface-2 p-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="h-9"
        />
        <Button type="submit" size="icon" variant="primary" disabled={sending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
