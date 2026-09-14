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

// ==================== Marketplace (customer/mechanic) ====================
// Mirrors supabase/migrations/0016_marketplace_schema.sql. Additive to the
// appointment-booking schema above — unrelated to it.

export type UserRole = "customer" | "mechanic";
export type VehicleType = "car" | "motorcycle" | "truck" | "van" | "other";
export type MechanicVerificationStatus = "pending" | "under_review" | "verified" | "rejected" | "suspended";
export type RequestStatus =
  | "REQUESTED"
  | "SEARCHING"
  | "MECHANIC_ASSIGNED"
  | "MECHANIC_ACCEPTED"
  | "MECHANIC_ON_THE_WAY"
  | "MECHANIC_ARRIVED"
  | "INSPECTION"
  | "WAITING_FOR_APPROVAL"
  | "REPAIRING"
  | "COMPLETED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "CANCELLED";
export type EstimateStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "cash" | "card" | "jazzcash" | "easypaisa" | "bank" | "online" | "payit";
export type PaymentStatus = "pending" | "completed" | "failed";
export type PayoutStatus = "requested" | "paid" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number | null;
  registration_number: string;
  created_at: string;
}

export interface Mechanic {
  id: string;
  business_name: string | null;
  specialties: string[];
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  service_radius_km: number;
  rating_avg: number;
  rating_count: number;
  trust_score: number;
  verification_status: MechanicVerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface MechanicDocument {
  id: string;
  mechanic_id: string;
  doc_type: string;
  file_url: string;
  status: string;
  created_at: string;
}

export interface MechanicLocation {
  mechanic_id: string;
  request_id: number | null;
  lat: number;
  lng: number;
  heading: number | null;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  is_emergency: boolean;
}

export interface ServiceRequest {
  id: number;
  customer_id: string;
  vehicle_id: string | null;
  category_id: string | null;
  mechanic_id: string | null;
  status: RequestStatus;
  is_emergency: boolean;
  lat: number;
  lng: number;
  address: string | null;
  description: string | null;
  photo_urls: string[];
  estimated_price: number | null;
  final_price: number | null;
  created_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

export interface ServiceRequestStatusHistory {
  id: string;
  request_id: number;
  status: RequestStatus;
  note: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  request_id: number;
  mechanic_id: string;
  notes: string | null;
  photo_urls: string[];
  created_at: string;
}

export interface InspectionItem {
  id: string;
  inspection_id: string;
  category: string;
  item: string;
  is_ok: boolean;
  note: string | null;
}

export interface RepairEstimate {
  id: string;
  request_id: number;
  labor_total: number;
  parts_total: number;
  service_fee: number;
  tax_total: number;
  grand_total: number;
  status: EstimateStatus;
  created_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  kind: "labor" | "part";
  name: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  request_id: number;
  customer_id: string;
  mechanic_id: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Payment {
  id: string;
  invoice_id: string | null;
  request_id: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  provider_reference: string | null;
  created_at: string;
}

export interface MechanicEarning {
  id: string;
  mechanic_id: string;
  request_id: number;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  created_at: string;
}

export interface Payout {
  id: string;
  mechanic_id: string;
  amount: number;
  status: PayoutStatus;
  requested_at: string;
  paid_at: string | null;
}

export interface Rating {
  id: string;
  request_id: number;
  customer_id: string;
  mechanic_id: string;
  overall: number;
  quality: number | null;
  punctuality: number | null;
  professionalism: number | null;
  pricing: number | null;
  communication: number | null;
  review: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  request_id: number;
  sender_id: string;
  body: string | null;
  location_lat: number | null;
  location_lng: number | null;
  read_at: string | null;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  user_id: string;
  request_id: number | null;
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyRequest {
  id: string;
  request_id: number;
  type: string;
  notified_admin_at: string | null;
  resolved_at: string | null;
}

// Minimal Supabase Database generic. Not exhaustive (see individual
// interfaces above for real shapes) — matching @supabase/supabase-js's exact
// GenericSchema constraints isn't worth it for a schema this small.
export type Database = any;
