import { CheckCircle2, Circle } from "lucide-react";
import type { RequestStatus } from "@/lib/supabase/types";

const FLOW: RequestStatus[] = [
  "REQUESTED", "SEARCHING", "MECHANIC_ASSIGNED", "MECHANIC_ACCEPTED",
  "MECHANIC_ON_THE_WAY", "MECHANIC_ARRIVED", "INSPECTION", "WAITING_FOR_APPROVAL",
  "REPAIRING", "COMPLETED", "PAYMENT_PENDING", "PAID",
];

const LABELS: Record<RequestStatus, string> = {
  REQUESTED: "Requested",
  SEARCHING: "Finding mechanic",
  MECHANIC_ASSIGNED: "Mechanic assigned",
  MECHANIC_ACCEPTED: "Mechanic accepted",
  MECHANIC_ON_THE_WAY: "On the way",
  MECHANIC_ARRIVED: "Arrived",
  INSPECTION: "Inspecting vehicle",
  WAITING_FOR_APPROVAL: "Waiting for your approval",
  REPAIRING: "Repair in progress",
  COMPLETED: "Job completed",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export function StatusTimeline({ status }: { status: RequestStatus }) {
  if (status === "CANCELLED") {
    return <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600">Request cancelled</p>;
  }
  const currentIdx = FLOW.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              {done || active ? (
                <CheckCircle2 className={`h-5 w-5 ${active ? "text-orange-600" : "text-green-600"}`} />
              ) : (
                <Circle className="h-5 w-5 text-neutral-300" />
              )}
              {i < FLOW.length - 1 && <div className={`h-6 w-0.5 ${done ? "bg-green-600" : "bg-neutral-200"}`} />}
            </div>
            <span className={`pb-6 text-sm ${active ? "font-semibold text-neutral-900" : done ? "text-neutral-500" : "text-neutral-400"}`}>
              {LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { LABELS as STATUS_LABELS };
