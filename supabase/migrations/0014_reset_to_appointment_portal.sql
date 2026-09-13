-- Reset: replace the mechanic-marketplace schema with a minimal
-- appointment-request portal (see AGENTS.md/BRD: customer submits a
-- date/time/car-number/name/mobile request; workshop manually confirms
-- or revises it and marks it "Appointment Fixed"). Everything else
-- (vehicles, invoicing, chat, live tracking, ratings, etc.) is out of
-- scope and is dropped here.

-- ---------- drop old auth wiring ----------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop function if exists is_admin() cascade;

-- ---------- drop old storage policies/buckets ----------
drop policy if exists "service_media_public_read" on storage.objects;
drop policy if exists "service_media_authenticated_upload" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_upload" on storage.objects;
drop policy if exists "mechanic_documents_owner_rw" on storage.objects;
drop policy if exists "mechanic_documents_owner_upload" on storage.objects;
-- Bucket/object rows are left in place (direct deletes from storage tables
-- are blocked outside the Storage API); they're unused by the new schema.

-- ---------- drop old tables ----------
drop table if exists fleet_vehicles cascade;
drop table if exists fleet_accounts cascade;
drop table if exists audit_logs cascade;
drop table if exists disputes cascade;
drop table if exists support_tickets cascade;
drop table if exists emergency_requests cascade;
drop table if exists coupons cascade;
drop table if exists pricing_rules cascade;
drop table if exists payouts cascade;
drop table if exists mechanic_earnings cascade;
drop table if exists notifications cascade;
drop table if exists message_attachments cascade;
drop table if exists messages cascade;
drop table if exists ratings cascade;
drop table if exists payments cascade;
drop table if exists invoice_items cascade;
drop table if exists invoices cascade;
drop table if exists estimate_items cascade;
drop table if exists repair_estimates cascade;
drop table if exists inspection_items cascade;
drop table if exists inspections cascade;
drop table if exists mechanic_locations cascade;
drop table if exists service_request_status_history cascade;
drop table if exists service_requests cascade;
drop table if exists saved_locations cascade;
drop table if exists service_categories cascade;
drop table if exists vehicles cascade;
drop table if exists mechanic_documents cascade;
drop table if exists mechanics cascade;
drop table if exists customers cascade;
drop table if exists profiles cascade;

drop type if exists emergency_type;
drop type if exists payment_status;
drop type if exists payment_method;
drop type if exists mechanic_verification_status;
drop type if exists request_status;
drop type if exists vehicle_type;
drop type if exists user_role;

-- ==================== NEW MINIMAL SCHEMA ====================
create extension if not exists "pgcrypto";

-- Explicit admin allowlist rather than "any authenticated user" so any
-- leftover/old auth.users rows never gain workshop access.
create table workshop_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table time_slots (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slot_time time not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table blocked_dates (
  date date primary key,
  reason text,
  created_at timestamptz not null default now()
);

create type appointment_status as enum ('requested', 'fixed');

create table appointments (
  id bigserial primary key,
  car_number text not null,
  owner_name text not null,
  owner_mobile text not null,
  requested_date date not null,
  requested_time time not null,
  final_date date,
  final_time time,
  status appointment_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_status on appointments(status);
create index idx_appointments_requested_date on appointments(requested_date);

create or replace function is_workshop_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workshop_admins where id = auth.uid());
$$;

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger appointments_set_updated_at
  before update on appointments
  for each row execute procedure set_updated_at();

-- ---------- RLS ----------
alter table appointments enable row level security;
alter table time_slots enable row level security;
alter table blocked_dates enable row level security;
alter table workshop_admins enable row level security;

-- Anyone (including anonymous visitors) can submit a request, but only as
-- a fresh 'requested' row with no final date/time set.
create policy appointments_public_insert on appointments
  for insert to anon, authenticated
  with check (status = 'requested' and final_date is null and final_time is null);

create policy appointments_admin_select on appointments
  for select to authenticated
  using (is_workshop_admin());

create policy appointments_admin_update on appointments
  for update to authenticated
  using (is_workshop_admin())
  with check (is_workshop_admin());

-- Time slots / blocked dates must be publicly readable so the customer
-- calendar can render availability without logging in.
create policy time_slots_public_select on time_slots
  for select to anon, authenticated
  using (true);

create policy time_slots_admin_write on time_slots
  for all to authenticated
  using (is_workshop_admin())
  with check (is_workshop_admin());

create policy blocked_dates_public_select on blocked_dates
  for select to anon, authenticated
  using (true);

create policy blocked_dates_admin_write on blocked_dates
  for all to authenticated
  using (is_workshop_admin())
  with check (is_workshop_admin());

create policy workshop_admins_admin_select on workshop_admins
  for select to authenticated
  using (is_workshop_admin());

-- ---------- seed default time slots ----------
insert into time_slots (label, slot_time, sort_order) values
  ('09:00 AM', '09:00', 1),
  ('10:00 AM', '10:00', 2),
  ('11:00 AM', '11:00', 3),
  ('12:00 PM', '12:00', 4),
  ('01:00 PM', '13:00', 5),
  ('02:00 PM', '14:00', 6),
  ('03:00 PM', '15:00', 7),
  ('04:00 PM', '16:00', 8)
on conflict (slot_time) do nothing;

-- ---------- seed the workshop admin account ----------
do $$
declare
  admin_id uuid;
  admin_email text := 'admin@mechaniconcall.app';
  admin_password text := 'Workshop@2026!';
begin
  select id into admin_id from auth.users where email = admin_email;

  if admin_id is null then
    admin_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      admin_email, crypt(admin_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"seed","providers":["seed"]}', '{}',
      false, false,
      '', '', '', '', '', '', '', ''
    );
  end if;

  insert into workshop_admins (id) values (admin_id)
  on conflict (id) do nothing;
end $$;
