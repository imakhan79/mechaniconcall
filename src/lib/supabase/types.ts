// Hand-authored types mirroring supabase/migrations/*.sql.
// Row = what a select returns. Insert = what you may write (defaults optional).

export type AppointmentStatus = "requested" | "fixed";

export interface Appointment {
  id: number;
  car_number: string;
  owner_name: string;
  owner_mobile: string;
  requested_date: string; // date, e.g. "2026-09-16"
  requested_time: string; // time, e.g. "10:00:00"
  final_date: string | null;
  final_time: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentInsert {
  car_number: string;
  owner_name: string;
  owner_mobile: string;
  requested_date: string;
  requested_time: string;
}

export interface TimeSlot {
  id: string;
  label: string;
  slot_time: string;
  is_active: boolean;
  sort_order: number;
}

export interface BlockedDate {
  date: string;
  reason: string | null;
  created_at: string;
}

// Minimal Supabase Database generic. Not exhaustive (see individual
// interfaces above for real shapes) — matching @supabase/supabase-js's exact
// GenericSchema constraints isn't worth it for a schema this small.
export type Database = any;
