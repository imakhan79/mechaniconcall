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
    supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at")
      .then(({ data }) => setMessages(data ?? []));

    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
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
    <div className="flex h-80 flex-col rounded-xl border border-neutral-200 bg-white">
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && <p className="p-2 text-center text-sm text-neutral-400">No messages yet.</p>}
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  mine ? "self-end bg-sky-700 text-white" : "self-start bg-neutral-100 text-neutral-900"
                )}
              >
                {m.body}
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-neutral-100 p-2">
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
