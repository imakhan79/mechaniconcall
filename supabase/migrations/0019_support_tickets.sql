-- Support ticket queue for customers/mechanics, moderated by admins.
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  request_id bigint references service_requests(id) on delete set null,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_support_tickets_user on support_tickets(user_id);
create index idx_support_tickets_status on support_tickets(status);

create trigger support_tickets_set_updated_at
  before update on support_tickets
  for each row execute procedure set_updated_at();

alter table support_tickets enable row level security;

create policy support_tickets_select on support_tickets for select to authenticated
  using (user_id = auth.uid() or is_workshop_admin());
create policy support_tickets_insert on support_tickets for insert to authenticated
  with check (user_id = auth.uid());
create policy support_tickets_admin_update on support_tickets for update to authenticated
  using (is_workshop_admin()) with check (is_workshop_admin());
