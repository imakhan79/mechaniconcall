"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAED } from "@/lib/currency";
import { adminCancelRequest } from "@/app/admin/actions";

export type BookingRow = {
  id: number;
  status: string;
  is_emergency: boolean;
  address: string | null;
  estimated_price: number | null;
  final_price: number | null;
  created_at: string;
  customer_name: string;
  mechanic_name: string | null;
  category_name: string | null;
};

const FILTERS = ["all", "pending", "assigned", "in_progress", "completed", "cancelled"] as const;
const PENDING = ["REQUESTED", "SEARCHING"];
const ASSIGNED = ["MECHANIC_ASSIGNED", "MECHANIC_ACCEPTED", "MECHANIC_ON_THE_WAY", "MECHANIC_ARRIVED"];
const IN_PROGRESS = ["INSPECTION", "WAITING_FOR_APPROVAL", "REPAIRING", "COMPLETED", "PAYMENT_PENDING"];
const DONE = ["PAID"];

function matchesFilter(status: string, filter: (typeof FILTERS)[number]) {
  if (filter === "all") return true;
  if (filter === "pending") return PENDING.includes(status);
  if (filter === "assigned") return ASSIGNED.includes(status);
  if (filter === "in_progress") return IN_PROGRESS.includes(status);
  if (filter === "completed") return DONE.includes(status);
  if (filter === "cancelled") return status === "CANCELLED";
  return true;
}

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!matchesFilter(b.status, filter)) return false;
      if (query && !`${b.id}`.includes(query) && !b.customer_name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [bookings, filter, query]);

  function handleCancel(id: number) {
    if (!window.confirm(`Cancel booking #${id}?`)) return;
    startTransition(async () => {
      const res = await adminCancelRequest(id);
      if (res.ok) toast.success("Booking cancelled");
      else toast.error(res.error);
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by booking ID or customer"
            className="w-64 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-brand-500 text-background" : "bg-surface-2 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface-2 text-left text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Mechanic</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  #{b.id} {b.is_emergency && <Badge variant="danger">Emergency</Badge>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.customer_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.mechanic_name ?? "Unassigned"}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.category_name ?? "—"}</td>
                <td className="px-4 py-3 text-foreground">{formatAED(b.final_price ?? b.estimated_price)}</td>
                <td className="px-4 py-3">
                  <Badge variant={b.status === "PAID" ? "success" : b.status === "CANCELLED" ? "danger" : "info"}>
                    {b.status.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{format(new Date(b.created_at), "d MMM, h:mm a")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/track/${b.id}`} className="text-xs font-medium text-brand-400 hover:underline">
                      View
                    </Link>
                    {!["PAID", "CANCELLED"].includes(b.status) && (
                      <button
                        disabled={pending}
                        onClick={() => handleCancel(b.id)}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No bookings match this filter.</p>}
      </div>
    </div>
  );
}
