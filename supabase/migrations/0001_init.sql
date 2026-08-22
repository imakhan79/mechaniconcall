-- Mechanic On Call: core schema
create extension if not exists "pgcrypto";

-- ========== ENUMS ==========
create type user_role as enum ('customer', 'mechanic', 'admin');
create type vehicle_type as enum ('car','bike','truck','van','bus','commercial');
create type request_status as enum (
  'REQUESTED','SEARCHING','MECHANIC_ASSIGNED','MECHANIC_ACCEPTED',
  'MECHANIC_ON_THE_WAY','MECHANIC_ARRIVED','INSPECTION','WAITING_FOR_APPROVAL',
  'REPAIRING','COMPLETED','PAYMENT_PENDING','PAID','CANCELLED'
);
create type mechanic_verification_status as enum ('pending','under_review','verified','rejected','suspended');
create type payment_method as enum ('cash','card','jazzcash','easypaisa','bank_transfer','online');
create type payment_status as enum ('pending','paid','failed','refunded');
create type emergency_type as enum ('accident','vehicle_stopped','medical','fire','dangerous_location','stranded_passenger','other');

-- ========== PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table mechanics (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text,
  bio text,
  specialties text[] not null default '{}',
  service_radius_km numeric not null default 10,
  is_online boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  rating_avg numeric not null default 0,
  rating_count integer not null default 0,
  trust_score numeric not null default 0,
  verification_status mechanic_verification_status not null default 'pending',
  working_hours jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table mechanic_documents (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  doc_type text not null,
  file_url text not null,
  status mechanic_verification_status not null default 'pending',
  uploaded_at timestamptz not null default now()
);

-- ========== VEHICLES ==========
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_type vehicle_type not null default 'car',
  make text not null,
  model text not null,
  year integer,
  registration_number text,
  vin text,
  color text,
  fuel_type text,
  mileage integer,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ========== SERVICE CATEGORIES ==========
create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  base_price numeric not null default 0,
  is_emergency boolean not null default false,
  sort_order integer not null default 0
);

-- ========== SAVED LOCATIONS ==========
create table saved_locations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

-- ========== SERVICE REQUESTS ==========
create table service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  category_id uuid references service_categories(id),
  mechanic_id uuid references mechanics(id) on delete set null,
  status request_status not null default 'REQUESTED',
  is_emergency boolean not null default false,
  emergency_type emergency_type,
  description text,
  media_urls text[] not null default '{}',
  lat double precision not null,
  lng double precision not null,
  address text,
  estimated_price numeric,
  final_price numeric,
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text
);

create table service_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  status request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table mechanic_locations (
  mechanic_id uuid primary key references mechanics(id) on delete cascade,
  request_id uuid references service_requests(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  heading numeric,
  updated_at timestamptz not null default now()
);

-- ========== INSPECTION ==========
create table inspections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  mechanic_id uuid not null references mechanics(id),
  notes text,
  photo_urls text[] not null default '{}',
  video_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table inspection_items (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  category text not null,
  item text not null,
  is_ok boolean not null default true,
  note text
);

-- ========== ESTIMATES ==========
create table repair_estimates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  labor_total numeric not null default 0,
  parts_total numeric not null default 0,
  service_fee numeric not null default 0,
  tax_total numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now()
);

create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references repair_estimates(id) on delete cascade,
  kind text not null, -- labor | part
  name text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0
);

-- ========== INVOICES ==========
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  request_id uuid not null references service_requests(id) on delete cascade,
  customer_id uuid not null references customers(id),
  mechanic_id uuid not null references mechanics(id),
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  payment_method payment_method,
  issued_at timestamptz not null default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0
);

-- ========== PAYMENTS ==========
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete set null,
  request_id uuid not null references service_requests(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount numeric not null,
  provider_reference text,
  created_at timestamptz not null default now()
);

-- ========== RATINGS / REVIEWS ==========
create table ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  customer_id uuid not null references customers(id),
  mechanic_id uuid not null references mechanics(id),
  overall integer not null check (overall between 1 and 5),
  professionalism integer check (professionalism between 1 and 5),
  response_time integer check (response_time between 1 and 5),
  quality integer check (quality between 1 and 5),
  price_fairness integer check (price_fairness between 1 and 5),
  communication integer check (communication between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);

-- ========== MESSAGING ==========
create table messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text,
  location_lat double precision,
  location_lng double precision,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  file_url text not null,
  file_type text not null
);

-- ========== NOTIFICATIONS ==========
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== EARNINGS ==========
create table mechanic_earnings (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  request_id uuid not null references service_requests(id) on delete cascade,
  gross_amount numeric not null,
  platform_fee numeric not null default 0,
  net_amount numeric not null,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  amount numeric not null,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

-- ========== MISC ==========
create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references service_categories(id),
  base_fee numeric not null default 0,
  per_km numeric not null default 0,
  emergency_surcharge_pct numeric not null default 0,
  night_surcharge_pct numeric not null default 0,
  active boolean not null default true
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent',
  discount_value numeric not null default 0,
  active boolean not null default true,
  expires_at timestamptz
);

create table emergency_requests (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  type emergency_type not null,
  notified_admin_at timestamptz,
  resolved_at timestamptz
);

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  subject text not null,
  body text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references service_requests(id),
  raised_by uuid references profiles(id),
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text,
  entity_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table fleet_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  company_name text not null,
  created_at timestamptz not null default now()
);

create table fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  fleet_id uuid not null references fleet_accounts(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade
);

-- ========== INDEXES ==========
create index idx_service_requests_customer on service_requests(customer_id);
create index idx_service_requests_mechanic on service_requests(mechanic_id);
create index idx_service_requests_status on service_requests(status);
create index idx_mechanics_online on mechanics(is_online);
create index idx_messages_request on messages(request_id);
create index idx_notifications_user on notifications(user_id, read_at);
create index idx_vehicles_customer on vehicles(customer_id);
