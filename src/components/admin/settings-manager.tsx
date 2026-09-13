"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addBlockedDate,
  addTimeSlot,
  deleteTimeSlot,
  removeBlockedDate,
  toggleTimeSlot,
} from "@/app/admin/settings/actions";
import type { BlockedDate, TimeSlot } from "@/lib/supabase/types";

type ActionResult = { ok: boolean; error?: string };

export function SettingsManager({ timeSlots, blockedDates }: { timeSlots: TimeSlot[]; blockedDates: BlockedDate[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newBlockedDate, setNewBlockedDate] = useState("");

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  function handleAddTimeSlot(e: FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("label", newLabel);
    fd.set("slotTime", newTime);
    run(async () => {
      const result = await addTimeSlot(fd);
      if (result.ok) {
        setNewLabel("");
        setNewTime("");
      }
      return result;
    });
  }

  function handleAddBlockedDate(e: FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("date", newBlockedDate);
    run(async () => {
      const result = await addBlockedDate(fd);
      if (result.ok) setNewBlockedDate("");
      return result;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Slots</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="divide-y divide-neutral-100">
            {timeSlots.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between py-2 text-sm">
                <span className={slot.is_active ? "text-neutral-900" : "text-neutral-400 line-through"}>
                  {slot.label}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-orange-600 hover:underline disabled:opacity-50"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("id", slot.id);
                      fd.set("isActive", String(slot.is_active));
                      run(() => toggleTimeSlot(fd));
                    }}
                  >
                    {slot.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${slot.label}`}
                    className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("id", slot.id);
                      run(() => deleteTimeSlot(fd));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {timeSlots.length === 0 && <li className="py-2 text-sm text-neutral-400">No time slots yet.</li>}
          </ul>

          <form className="flex flex-wrap gap-2 pt-2" onSubmit={handleAddTimeSlot}>
            <Input
              placeholder="Label, e.g. 09:00 AM"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
              className="min-w-[160px] flex-1"
            />
            <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} required className="w-32" />
            <Button type="submit" size="icon" variant="outline" disabled={pending} aria-label="Add time slot">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unavailable Dates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="divide-y divide-neutral-100">
            {blockedDates.map((b) => (
              <li key={b.date} className="flex items-center justify-between py-2 text-sm">
                <span className="text-neutral-900">{b.date}</span>
                <button
                  type="button"
                  aria-label={`Unblock ${b.date}`}
                  className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
                  disabled={pending}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("date", b.date);
                    run(() => removeBlockedDate(fd));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {blockedDates.length === 0 && <li className="py-2 text-sm text-neutral-400">No blocked dates.</li>}
          </ul>

          <form className="flex gap-2 pt-2" onSubmit={handleAddBlockedDate}>
            <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} required />
            <Button type="submit" size="icon" variant="outline" disabled={pending} aria-label="Block date">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
