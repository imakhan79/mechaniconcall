"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Appointment } from "@/lib/supabase/types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const } },
};

export function AppointmentsTableBody({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
            No appointments found.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <motion.tbody className="divide-y divide-sky-50" variants={container} initial="hidden" animate="show">
      {appointments.map((a) => (
        <motion.tr key={a.id} variants={row} className="transition-colors hover:bg-sky-50/50">
          <td className="px-4 py-3 font-medium text-neutral-900">#{a.id}</td>
          <td className="px-4 py-3">{a.car_number}</td>
          <td className="px-4 py-3">{a.owner_name}</td>
          <td className="px-4 py-3">{a.owner_mobile}</td>
          <td className="px-4 py-3">{format(new Date(`${a.requested_date}T00:00:00`), "d MMM yyyy")}</td>
          <td className="px-4 py-3">
            <Badge variant={a.status === "fixed" ? "success" : "warning"}>
              {a.status === "fixed" ? "Appointment Fixed" : "Appointment Requested"}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right">
            <Link href={`/admin/appointments/${a.id}`} className="text-sm font-medium text-sky-700 hover:underline">
              Open
            </Link>
          </td>
        </motion.tr>
      ))}
    </motion.tbody>
  );
}
