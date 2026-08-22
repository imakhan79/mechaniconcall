-- Row Level Security
alter table profiles enable row level security;
alter table customers enable row level security;
alter table mechanics enable row level security;
alter table mechanic_documents enable row level security;
alter table vehicles enable row level security;
alter table service_categories enable row level security;
alter table saved_locations enable row level security;
alter table service_requests enable row level security;
alter table service_request_status_history enable row level security;
alter table mechanic_locations enable row level security;
alter table inspections enable row level security;
alter table inspection_items enable row level security;
alter table repair_estimates enable row level security;
alter table estimate_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table ratings enable row level security;
alter table messages enable row level security;
alter table message_attachments enable row level security;
alter table notifications enable row level security;
alter table mechanic_earnings enable row level security;
alter table payouts enable row level security;
alter table pricing_rules enable row level security;
alter table coupons enable row level security;
alter table emergency_requests enable row level security;
alter table support_tickets enable row level security;
alter table disputes enable row level security;
alter table audit_logs enable row level security;
alter table fleet_accounts enable row level security;
alter table fleet_vehicles enable row level security;

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create or replace function is_request_participant(req_id uuid) returns boolean as $$
  select exists (
    select 1 from service_requests sr
    where sr.id = req_id
      and (sr.customer_id = auth.uid() or sr.mechanic_id = auth.uid())
  );
$$ language sql security definer stable;

-- profiles: user sees/edits own row; admin sees all
create policy "profiles_select_own_or_admin" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_insert_own" on profiles for insert with check (id = auth.uid());

create policy "customers_self_or_admin" on customers for select using (id = auth.uid() or is_admin());
create policy "customers_insert_own" on customers for insert with check (id = auth.uid());

-- mechanics are publicly viewable (needed for discovery), admin full access, self can update
create policy "mechanics_select_all" on mechanics for select using (true);
create policy "mechanics_insert_own" on mechanics for insert with check (id = auth.uid());
create policy "mechanics_update_own_or_admin" on mechanics for update using (id = auth.uid() or is_admin());

create policy "mechanic_documents_owner_or_admin" on mechanic_documents for select using (mechanic_id = auth.uid() or is_admin());
create policy "mechanic_documents_insert_own" on mechanic_documents for insert with check (mechanic_id = auth.uid());

create policy "vehicles_owner_or_admin" on vehicles for select using (customer_id = auth.uid() or is_admin());
create policy "vehicles_insert_own" on vehicles for insert with check (customer_id = auth.uid());
create policy "vehicles_update_own" on vehicles for update using (customer_id = auth.uid());
create policy "vehicles_delete_own" on vehicles for delete using (customer_id = auth.uid());

create policy "service_categories_public_read" on service_categories for select using (true);
create policy "service_categories_admin_write" on service_categories for all using (is_admin());

create policy "saved_locations_owner" on saved_locations for all using (customer_id = auth.uid());

create policy "service_requests_participants_or_admin" on service_requests for select
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_admin());
create policy "service_requests_insert_own" on service_requests for insert with check (customer_id = auth.uid());
create policy "service_requests_update_participants_or_admin" on service_requests for update
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_admin());

-- nearby mechanics need to see open/unassigned requests to pick up jobs
create policy "service_requests_mechanics_see_open" on service_requests for select
  using (status in ('REQUESTED','SEARCHING') and exists (select 1 from mechanics m where m.id = auth.uid()));

create policy "status_history_participants_or_admin" on service_request_status_history for select
  using (is_request_participant(request_id) or is_admin());
create policy "status_history_insert_participants" on service_request_status_history for insert
  with check (is_request_participant(request_id));

create policy "mechanic_locations_select_all" on mechanic_locations for select using (true);
create policy "mechanic_locations_upsert_own" on mechanic_locations for insert with check (mechanic_id = auth.uid());
create policy "mechanic_locations_update_own" on mechanic_locations for update using (mechanic_id = auth.uid());

create policy "inspections_participants_or_admin" on inspections for select using (is_request_participant(request_id) or is_admin());
create policy "inspections_insert_mechanic" on inspections for insert with check (mechanic_id = auth.uid());

create policy "inspection_items_via_inspection" on inspection_items for select
  using (exists (select 1 from inspections i where i.id = inspection_id and (is_request_participant(i.request_id) or is_admin())));
create policy "inspection_items_insert_via_inspection" on inspection_items for insert
  with check (exists (select 1 from inspections i where i.id = inspection_id and i.mechanic_id = auth.uid()));

create policy "estimates_participants_or_admin" on repair_estimates for select using (is_request_participant(request_id) or is_admin());
create policy "estimates_insert_participants" on repair_estimates for insert with check (is_request_participant(request_id));
create policy "estimates_update_participants" on repair_estimates for update using (is_request_participant(request_id));

create policy "estimate_items_via_estimate" on estimate_items for select
  using (exists (select 1 from repair_estimates e where e.id = estimate_id and (is_request_participant(e.request_id) or is_admin())));
create policy "estimate_items_insert_via_estimate" on estimate_items for insert
  with check (exists (select 1 from repair_estimates e where e.id = estimate_id and is_request_participant(e.request_id)));

create policy "invoices_participants_or_admin" on invoices for select
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_admin());

create policy "invoice_items_via_invoice" on invoice_items for select
  using (exists (select 1 from invoices i where i.id = invoice_id and (i.customer_id = auth.uid() or i.mechanic_id = auth.uid() or is_admin())));

create policy "payments_participants_or_admin" on payments for select using (is_request_participant(request_id) or is_admin());
create policy "payments_insert_participants" on payments for insert with check (is_request_participant(request_id));

create policy "ratings_public_read" on ratings for select using (true);
create policy "ratings_insert_customer" on ratings for insert with check (customer_id = auth.uid());

create policy "messages_participants" on messages for select using (is_request_participant(request_id) or is_admin());
create policy "messages_insert_participants" on messages for insert with check (sender_id = auth.uid() and is_request_participant(request_id));

create policy "message_attachments_via_message" on message_attachments for select
  using (exists (select 1 from messages m where m.id = message_id and is_request_participant(m.request_id)));

create policy "notifications_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (user_id = auth.uid());

create policy "earnings_own_or_admin" on mechanic_earnings for select using (mechanic_id = auth.uid() or is_admin());
create policy "payouts_own_or_admin" on payouts for select using (mechanic_id = auth.uid() or is_admin());
create policy "payouts_insert_own" on payouts for insert with check (mechanic_id = auth.uid());

create policy "pricing_rules_public_read" on pricing_rules for select using (true);
create policy "pricing_rules_admin_write" on pricing_rules for all using (is_admin());

create policy "coupons_public_read" on coupons for select using (active = true);
create policy "coupons_admin_write" on coupons for all using (is_admin());

create policy "emergency_requests_participants_or_admin" on emergency_requests for select
  using (is_request_participant(request_id) or is_admin());
create policy "emergency_requests_insert_participants" on emergency_requests for insert with check (is_request_participant(request_id));

create policy "support_tickets_own_or_admin" on support_tickets for select using (user_id = auth.uid() or is_admin());
create policy "support_tickets_insert_own" on support_tickets for insert with check (user_id = auth.uid());

create policy "disputes_own_or_admin" on disputes for select using (raised_by = auth.uid() or is_admin());
create policy "disputes_insert_own" on disputes for insert with check (raised_by = auth.uid());

create policy "audit_logs_admin_only" on audit_logs for select using (is_admin());

create policy "fleet_accounts_owner_or_admin" on fleet_accounts for select using (owner_id = auth.uid() or is_admin());
create policy "fleet_vehicles_via_fleet" on fleet_vehicles for select
  using (exists (select 1 from fleet_accounts f where f.id = fleet_id and (f.owner_id = auth.uid() or is_admin())));
