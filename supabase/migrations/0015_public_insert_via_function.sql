-- Fix: PostgREST's insert-with-representation (RETURNING) requires
-- SELECT-policy visibility on the new row for the calling role. `anon`
-- deliberately has no SELECT policy on appointments (only the workshop can
-- read requests), so `.insert(...).select()` as anon/authenticated always
-- failed RLS even though the insert itself was allowed.
--
-- Route public submission through a SECURITY DEFINER function instead: it
-- runs as the table owner (which bypasses RLS entirely) and returns only
-- the new id, so no direct anon SELECT/INSERT grant on the table is needed.

drop policy if exists appointments_public_insert on public.appointments;
revoke insert on public.appointments from anon, authenticated;

create or replace function public.request_appointment(
  p_car_number text,
  p_owner_name text,
  p_owner_mobile text,
  p_requested_date date,
  p_requested_time time
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into appointments (car_number, owner_name, owner_mobile, requested_date, requested_time)
  values (p_car_number, p_owner_name, p_owner_mobile, p_requested_date, p_requested_time)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.request_appointment(text, text, text, date, time) to anon, authenticated;
