"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AppointmentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? "");

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  function reset() {
    setQ("");
    setStatus("");
    setDate("");
    router.push(pathname);
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        <Input
          className="pl-9"
          placeholder="Search ID, car no., name, or mobile"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-700"
      >
        <option value="">All statuses</option>
        <option value="requested">Appointment Requested</option>
        <option value="fixed">Appointment Fixed</option>
      </select>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-700"
        aria-label="Filter by appointment date"
      />
      <Button type="submit" variant="outline">
        Filter
      </Button>
      {(q || status || date) && (
        <Button type="button" variant="ghost" onClick={reset}>
          Clear
        </Button>
      )}
    </form>
  );
}
