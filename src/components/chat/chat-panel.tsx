"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Message } from "@/lib/supabase/types";

const QUICK_REPLIES = ["I'm coming.", "Where exactly are you?", "I'm here.", "Please share your location."];

export function ChatPanel({
  requestId,
  currentUserId,
  onClose,
}: {
  requestId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at")
      .then(({ data }) => {
        if (active && data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${requestId}` },
        (payload) => setMessages((m) => [...m, payload.new as Message])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [requestId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(body: string) {
    if (!body.trim()) return;
    setText("");
    await supabase.from("messages").insert({ request_id: requestId, sender_id: currentUserId, body });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[520px] sm:w-96 sm:rounded-2xl">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <h3 className="font-semibold">Chat</h3>
        <button onClick={onClose}><X className="h-5 w-5 text-neutral-400" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-neutral-400">No messages yet. Say hello!</p>}
        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-orange-600 text-white" : "bg-neutral-100 text-neutral-900"}`}>
                {m.body}
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-100 p-2">
        {QUICK_REPLIES.map((q) => (
          <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-neutral-200 px-3 py-1 text-xs hover:border-orange-300">
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex gap-2 border-t border-neutral-200 p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
        />
        <Button type="submit" size="icon" variant="primary"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
