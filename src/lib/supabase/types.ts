// Hand-authored types mirroring supabase/migrations/*.sql.
// Row = what a select returns. Insert = what you may write (defaults optional).

export type RequestStatus =
  | "REQUESTED" | "SEARCHING" | "MECHANIC_ASSIGNED" | "MECHANIC_ACCEPTED"
  | "MECHANIC_ON_THE_WAY" | "MECHANIC_ARRIVED" | "INSPECTION" | "WAITING_FOR_APPROVAL"
  | "REPAIRING" | "COMPLETED" | "PAYMENT_PENDING" | "PAID" | "CANCELLED";

export type VehicleType = "car" | "bike" | "truck" | "van" | "bus" | "commercial";
export type UserRole = "customer" | "mechanic" | "admin";
export type MechanicVerificationStatus = "pending" | "under_review" | "verified" | "rejected" | "suspended";
export type PaymentMethod = "cash" | "card" | "jazzcash" | "easypaisa" | "bank_transfer" | "online";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EmergencyType = "accident" | "vehicle_stopped" | "medical" | "fire" | "dangerous_location" | "stranded_passenger" | "other";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mechanic {
  id: string;
  business_name: string | null;
  bio: string | null;
  specialties: string[];
  service_radius_km: number;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating_avg: number;
  rating_count: number;
  trust_score: number;
  verification_status: MechanicVerificationStatus;
  working_hours: Record<string, unknown>;
  created_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number | null;
  registration_number: string | null;
  vin: string | null;
  color: string | null;
  fuel_type: string | null;
  mileage: number | null;
  photo_url: string | null;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  base_price: number;
  is_emergency: boolean;
  sort_order: number;
}

export interface ServiceRequest {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  category_id: string | null;
  mechanic_id: string | null;
  status: RequestStatus;
  is_emergency: boolean;
  emergency_type: EmergencyType | null;
  description: string | null;
  media_urls: string[];
  lat: number;
  lng: number;
  address: string | null;
  estimated_price: number | null;
  final_price: number | null;
  requested_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface MechanicLocation {
  mechanic_id: string;
  request_id: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  updated_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  body: string | null;
  location_lat: number | null;
  location_lng: number | null;
  read_at: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  request_id: string;
  mechanic_id: string;
  notes: string | null;
  photo_urls: string[];
  video_urls: string[];
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
  request_id: string;
  labor_total: number;
  parts_total: number;
  service_fee: number;
  tax_total: number;
  grand_total: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  kind: "labor" | "part";
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  request_id: string;
  customer_id: string;
  mechanic_id: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod | null;
  issued_at: string;
}

export interface Rating {
  id: string;
  request_id: string;
  customer_id: string;
  mechanic_id: string;
  overall: number;
  professionalism: number | null;
  response_time: number | null;
  quality: number | null;
  price_fairness: number | null;
  communication: number | null;
  review: string | null;
  created_at: string;
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

export interface SavedLocation {
  id: string;
  customer_id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface MechanicEarning {
  id: string;
  mechanic_id: string;
  request_id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  created_at: string;
}

// Minimal Supabase Database generic. Not exhaustive (see individual
// interfaces above for the real shapes) — enough to keep the typed
// client ergonomic without blocking on codegen against the pooler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
