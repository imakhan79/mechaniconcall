-- Restore a customer/mechanic marketplace alongside the existing
-- appointment-booking system. Nothing here touches appointments,
-- time_slots, blocked_dates, or workshop_admins — this is purely
-- additive. Reconstructed from this project's own git history
-- (pre-bbc5870), with every RLS bug found in that history's later fix
-- commits corrected from the start (see plan notes): explicit
-- WITH CHECK on service_requests updates plus a separate "claim an
-- open job" policy, INSERT policies on invoices/invoice_items/
-- mechanic_earnings/notifications, and an admin UPDATE policy on
-- mechanic_documents.

-- ---------- enums ----------
create type user_role as enum ('customer', 'mechanic');
create type vehicle_type as enum ('car', 'motorcycle', 'truck', 'van', 'other');
create type mechanic_verification_status as enum ('pending', 'under_review', 'verified', 'rejected', 'suspended');
create type request_status as enum (
  'REQUESTED', 'SEARCHING', 'MECHANIC_ASSIGNED', 'MECHANIC_ACCEPTED',
  'MECHANIC_ON_THE_WAY', 'MECHANIC_ARRIVED', 'INSPECTION', 'WAITING_FOR_APPROVAL',
  'REPAIRING', 'COMPLETED', 'PAYMENT_PENDING', 'PAID', 'CANCELLED'
);
create type estimate_status as enum ('pending', 'approved', 'rejected');
create type payment_method as enum ('cash', 'card', 'jazzcash', 'easypaisa', 'bank', 'online');
create type payment_status as enum ('pending', 'completed', 'failed');
create type payout_status as enum ('requested', 'paid', 'rejected');

-- ---------- identity ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key references profiles(id) on delete cascade
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_type vehicle_type not null default 'car',
  make text not null,
  model text not null,
  year integer,
  registration_number text not null,
  created_at timestamptz not null default now()
);
create index idx_vehicles_customer on vehicles(customer_id);

create table mechanics (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text,
  specialties text[] not null default '{}',
  is_online boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  service_radius_km numeric not null default 15,
  rating_avg numeric not null default 0,
  rating_count integer not null default 0,
  trust_score numeric not null default 0,
  verification_status mechanic_verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mechanic_documents (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  doc_type text not null,
  file_url text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- catalog ----------
create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  base_price numeric not null default 0,
  is_emergency boolean not null default false
);

-- ---------- service request lifecycle ----------
create table service_requests (
  id bigserial primary key,
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  category_id uuid references service_categories(id) on delete set null,
  mechanic_id uuid references mechanics(id) on delete set null,
  status request_status not null default 'SEARCHING',
  is_emergency boolean not null default false,
  lat double precision not null,
  lng double precision not null,
  address text,
  description text,
  photo_urls text[] not null default '{}',
  estimated_price numeric,
  final_price numeric,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);
create index idx_service_requests_status on service_requests(status);
create index idx_service_requests_customer on service_requests(customer_id);
create index idx_service_requests_mechanic on service_requests(mechanic_id);

create table mechanic_locations (
  mechanic_id uuid primary key references mechanics(id) on delete cascade,
  request_id bigint references service_requests(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  heading numeric,
  updated_at timestamptz not null default now()
);

create table service_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references service_requests(id) on delete cascade,
  status request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table inspections (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references service_requests(id) on delete cascade,
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  notes text,
  photo_urls text[] not null default '{}',
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

create table repair_estimates (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references service_requests(id) on delete cascade,
  labor_total numeric not null default 0,
  parts_total numeric not null default 0,
  service_fee numeric not null default 0,
  tax_total numeric not null default 0,
  grand_total numeric not null default 0,
  status estimate_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references repair_estimates(id) on delete cascade,
  kind text not null default 'part' check (kind in ('labor', 'part')),
  name text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0
);

-- ---------- financial (record-keeping only, no payment gateway) ----------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  request_id bigint not null references service_requests(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  payment_method text,
  created_at timestamptz not null default now()
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete set null,
  request_id bigint not null references service_requests(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'completed',
  amount numeric not null,
  provider_reference text,
  created_at timestamptz not null default now()
);

create table mechanic_earnings (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  request_id bigint not null references service_requests(id) on delete cascade,
  gross_amount numeric not null,
  platform_fee numeric not null,
  net_amount numeric not null,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  amount numeric not null,
  status payout_status not null default 'requested',
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

-- ---------- reviews, chat, notifications, emergency ----------
create table ratings (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null unique references service_requests(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  overall integer not null check (overall between 1 and 5),
  quality integer check (quality between 1 and 5),
  punctuality integer check (punctuality between 1 and 5),
  professionalism integer check (professionalism between 1 and 5),
  pricing integer check (pricing between 1 and 5),
  communication integer check (communication between 1 and 5),
  review text,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references service_requests(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
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
  file_type text
);

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

create table emergency_requests (
  id uuid primary key default gen_random_uuid(),
  request_id bigint not null references service_requests(id) on delete cascade,
  type text not null,
  notified_admin_at timestamptz,
  resolved_at timestamptz
);

-- ---------- functions & triggers ----------
create or replace function public.handle_new_marketplace_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer');

  insert into profiles (id, role, full_name, phone)
  values (
    new.id, v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  if v_role = 'mechanic' then
    insert into mechanics (id) values (new.id) on conflict (id) do nothing;
  else
    insert into customers (id) values (new.id) on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_marketplace_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_marketplace_user();

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();

create trigger mechanics_set_updated_at
  before update on mechanics
  for each row execute procedure set_updated_at();

create trigger service_requests_set_updated_at
  before update on service_requests
  for each row execute procedure set_updated_at();

create or replace function public.is_request_participant(p_request_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from service_requests sr
    where sr.id = p_request_id
      and (sr.customer_id = auth.uid() or sr.mechanic_id = auth.uid())
  );
$$;

create or replace function public.refresh_mechanic_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update mechanics set
    rating_count = (select count(*) from ratings where mechanic_id = new.mechanic_id),
    rating_avg = (select coalesce(avg(overall), 0) from ratings where mechanic_id = new.mechanic_id)
  where id = new.mechanic_id;
  return new;
end;
$$;

create trigger ratings_refresh_mechanic_rating
  after insert on ratings
  for each row execute procedure public.refresh_mechanic_rating();

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table mechanics enable row level security;
alter table mechanic_documents enable row level security;
alter table mechanic_locations enable row level security;
alter table service_categories enable row level security;
alter table service_requests enable row level security;
alter table service_request_status_history enable row level security;
alter table inspections enable row level security;
alter table inspection_items enable row level security;
alter table repair_estimates enable row level security;
alter table estimate_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table mechanic_earnings enable row level security;
alter table payouts enable row level security;
alter table ratings enable row level security;
alter table messages enable row level security;
alter table message_attachments enable row level security;
alter table notifications enable row level security;
alter table emergency_requests enable row level security;

-- profiles: public read (mechanic directory, chat display names), self write
create policy profiles_public_select on profiles for select to anon, authenticated using (true);
create policy profiles_self_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- customers: self + admin
create policy customers_select on customers for select to authenticated
  using (id = auth.uid() or is_workshop_admin());
create policy customers_self_update on customers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- vehicles: owner + admin
create policy vehicles_select on vehicles for select to authenticated
  using (customer_id = auth.uid() or is_workshop_admin());
create policy vehicles_owner_write on vehicles for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- mechanics: public read (directory), self or admin write
create policy mechanics_public_select on mechanics for select to anon, authenticated using (true);
create policy mechanics_self_or_admin_write on mechanics for update to authenticated
  using (id = auth.uid() or is_workshop_admin())
  with check (id = auth.uid() or is_workshop_admin());

-- mechanic_documents: owner select/insert, admin select/update (verification)
create policy mechanic_documents_owner_select on mechanic_documents for select to authenticated
  using (mechanic_id = auth.uid() or is_workshop_admin());
create policy mechanic_documents_owner_insert on mechanic_documents for insert to authenticated
  with check (mechanic_id = auth.uid());
create policy mechanic_documents_admin_update on mechanic_documents for update to authenticated
  using (is_workshop_admin()) with check (is_workshop_admin());

-- mechanic_locations: participant/owner/admin read, owner write
create policy mechanic_locations_select on mechanic_locations for select to authenticated
  using (
    mechanic_id = auth.uid() or is_workshop_admin()
    or (request_id is not null and is_request_participant(request_id))
  );
create policy mechanic_locations_owner_write on mechanic_locations for all to authenticated
  using (mechanic_id = auth.uid()) with check (mechanic_id = auth.uid());

-- service_categories: public read, admin write
create policy service_categories_public_select on service_categories for select to anon, authenticated using (true);
create policy service_categories_admin_write on service_categories for all to authenticated
  using (is_workshop_admin()) with check (is_workshop_admin());

-- service_requests: participant/admin select, mechanics see open jobs,
-- customer inserts own, corrected update policies (see header note)
create policy service_requests_participant_select on service_requests for select to authenticated
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_workshop_admin());
create policy service_requests_open_select on service_requests for select to authenticated
  using (status = 'SEARCHING');
create policy service_requests_customer_insert on service_requests for insert to authenticated
  with check (customer_id = auth.uid());
create policy service_requests_owner_update on service_requests for update to authenticated
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_workshop_admin())
  with check (customer_id = auth.uid() or is_workshop_admin() or mechanic_id = auth.uid() or mechanic_id is null);
create policy service_requests_mechanic_claim_open on service_requests for update to authenticated
  using (status = 'SEARCHING' and mechanic_id is null)
  with check (mechanic_id = auth.uid());

-- service_request_status_history: participant/admin
create policy service_request_status_history_select on service_request_status_history for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy service_request_status_history_insert on service_request_status_history for insert to authenticated
  with check (is_request_participant(request_id) or is_workshop_admin());

-- inspections / inspection_items: participant/admin
create policy inspections_select on inspections for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy inspections_mechanic_insert on inspections for insert to authenticated
  with check (mechanic_id = auth.uid() and is_request_participant(request_id));
create policy inspection_items_select on inspection_items for select to authenticated
  using (exists (select 1 from inspections i where i.id = inspection_id and (is_request_participant(i.request_id) or is_workshop_admin())));
create policy inspection_items_insert on inspection_items for insert to authenticated
  with check (exists (select 1 from inspections i where i.id = inspection_id and i.mechanic_id = auth.uid()));

-- repair_estimates / estimate_items: participant/admin, customer can update status
create policy repair_estimates_select on repair_estimates for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy repair_estimates_mechanic_insert on repair_estimates for insert to authenticated
  with check (is_request_participant(request_id));
create policy repair_estimates_update on repair_estimates for update to authenticated
  using (is_request_participant(request_id)) with check (is_request_participant(request_id));
create policy estimate_items_select on estimate_items for select to authenticated
  using (exists (select 1 from repair_estimates e where e.id = estimate_id and (is_request_participant(e.request_id) or is_workshop_admin())));
create policy estimate_items_insert on estimate_items for insert to authenticated
  with check (exists (select 1 from repair_estimates e where e.id = estimate_id and is_request_participant(e.request_id)));

-- invoices / invoice_items: participant/admin select + insert (fix: original schema had no insert policy here)
create policy invoices_select on invoices for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy invoices_insert on invoices for insert to authenticated
  with check (is_request_participant(request_id));
create policy invoice_items_select on invoice_items for select to authenticated
  using (exists (select 1 from invoices v where v.id = invoice_id and (is_request_participant(v.request_id) or is_workshop_admin())));
create policy invoice_items_insert on invoice_items for insert to authenticated
  with check (exists (select 1 from invoices v where v.id = invoice_id and is_request_participant(v.request_id)));

-- payments: participant/admin select + insert (record-keeping only)
create policy payments_select on payments for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy payments_insert on payments for insert to authenticated
  with check (is_request_participant(request_id));

-- mechanic_earnings: owner/admin select, owner insert (fix: original had no insert policy)
create policy mechanic_earnings_select on mechanic_earnings for select to authenticated
  using (mechanic_id = auth.uid() or is_workshop_admin());
create policy mechanic_earnings_insert on mechanic_earnings for insert to authenticated
  with check (mechanic_id = auth.uid());

-- payouts: owner select/insert, admin select/update
create policy payouts_select on payouts for select to authenticated
  using (mechanic_id = auth.uid() or is_workshop_admin());
create policy payouts_owner_insert on payouts for insert to authenticated
  with check (mechanic_id = auth.uid());
create policy payouts_admin_update on payouts for update to authenticated
  using (is_workshop_admin()) with check (is_workshop_admin());

-- ratings: public read, customer inserts own completed request's rating
create policy ratings_public_select on ratings for select to anon, authenticated using (true);
create policy ratings_customer_insert on ratings for insert to authenticated
  with check (customer_id = auth.uid() and is_request_participant(request_id));

-- messages / message_attachments: participant only
create policy messages_select on messages for select to authenticated
  using (is_request_participant(request_id));
create policy messages_insert on messages for insert to authenticated
  with check (sender_id = auth.uid() and is_request_participant(request_id));
create policy message_attachments_select on message_attachments for select to authenticated
  using (exists (select 1 from messages m where m.id = message_id and is_request_participant(m.request_id)));
create policy message_attachments_insert on message_attachments for insert to authenticated
  with check (exists (select 1 from messages m where m.id = message_id and m.sender_id = auth.uid()));

-- notifications: own select/update, permissive insert (fix: original had no insert policy)
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on notifications for insert to authenticated
  with check (auth.role() = 'authenticated');

-- emergency_requests: participant/admin
create policy emergency_requests_select on emergency_requests for select to authenticated
  using (is_request_participant(request_id) or is_workshop_admin());
create policy emergency_requests_insert on emergency_requests for insert to authenticated
  with check (is_request_participant(request_id));

-- ---------- storage policies (buckets already exist) ----------
drop policy if exists "service_media_public_read" on storage.objects;
drop policy if exists "service_media_authenticated_upload" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_upload" on storage.objects;
drop policy if exists "mechanic_documents_owner_rw" on storage.objects;
drop policy if exists "mechanic_documents_owner_upload" on storage.objects;
drop policy if exists "mechanic_documents_admin_read" on storage.objects;

create policy "service_media_public_read" on storage.objects for select
  using (bucket_id = 'service-media');
create policy "service_media_authenticated_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'service-media');

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_owner_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "mechanic_documents_owner_rw" on storage.objects for select to authenticated
  using (bucket_id = 'mechanic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mechanic_documents_owner_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'mechanic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mechanic_documents_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'mechanic-documents' and is_workshop_admin());

-- ---------- seed service categories ----------
insert into service_categories (name, slug, base_price, is_emergency) values
  ('Battery Jumpstart', 'battery-jumpstart', 1500, true),
  ('Flat Tire Change', 'flat-tire', 1200, true),
  ('Towing', 'towing', 3000, true),
  ('Fuel Delivery', 'fuel-delivery', 1000, true),
  ('General Diagnostics', 'diagnostics', 2000, false),
  ('Brake Service', 'brake-service', 2500, false),
  ('Engine Repair', 'engine-repair', 5000, false),
  ('AC Service', 'ac-service', 2000, false)
on conflict (slug) do nothing;
