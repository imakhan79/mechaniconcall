-- Auto-provision profiles/customers/mechanics rows when a user signs up,
-- reading role/full_name/phone out of auth.users.raw_user_meta_data.
-- Runs as SECURITY DEFINER so it bypasses RLS during provisioning (the
-- alternative — inserting from the client right after signUp — breaks
-- whenever email confirmation is enabled, since no session/JWT exists yet).
create or replace function handle_new_user() returns trigger as $$
declare
  v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer');

  insert into profiles (id, role, full_name, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  if v_role = 'mechanic' then
    insert into mechanics (id, verification_status) values (new.id, 'pending')
    on conflict (id) do nothing;
  else
    insert into customers (id) values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
