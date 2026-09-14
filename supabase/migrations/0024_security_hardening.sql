-- Two RLS gaps found in a security audit:
--
-- 1. mechanics_public_select exposed live GPS (current_lat/current_lng) to
--    the fully anonymous `anon` role for every online mechanic, not just to
--    a customer with an active shared job. Restrict the base table to
--    `authenticated` only, and add a safe public view (no coordinates) for
--    the anonymous /mechanics directory page.
--
-- 2. service_requests_owner_update let an authenticated customer rewrite
--    their OWN request's status/final_price/mechanic_id to anything at all
--    (e.g. self-marking PAID, or zeroing final_price) as long as
--    customer_id stayed theirs. Add a trigger that only lets a customer
--    apply the exact transitions the app's own UI performs; everything
--    else silently reverts those protected columns. Admins and the
--    assigned mechanic are unaffected.

-- ---------- 1. mechanics location exposure ----------
drop policy if exists mechanics_public_select on mechanics;
create policy mechanics_authenticated_select on mechanics for select to authenticated using (true);

create view mechanics_directory as
  select m.id, m.business_name, m.specialties, m.is_online, m.rating_avg, m.rating_count,
         m.verification_status, p.full_name
  from mechanics m
  join profiles p on p.id = m.id
  where m.verification_status = 'verified';

grant select on mechanics_directory to anon, authenticated;

-- ---------- 2. service_requests customer-write guard ----------
create or replace function public.enforce_service_request_customer_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Admins and the assigned mechanic (before or after this update) keep
  -- their existing full write access — already correctly scoped by RLS.
  if is_workshop_admin() or auth.uid() = old.mechanic_id or auth.uid() = new.mechanic_id then
    return new;
  end if;

  if auth.uid() = old.customer_id then
    -- a) customer claims an open mechanic while searching
    if old.status = 'SEARCHING' and old.mechanic_id is null
       and new.status = 'MECHANIC_ASSIGNED' and new.mechanic_id is not null then
      return new;
    end if;

    -- b) customer cancels while still cancellable
    if new.status = 'CANCELLED'
       and old.status in ('REQUESTED', 'SEARCHING', 'MECHANIC_ASSIGNED', 'MECHANIC_ACCEPTED') then
      new.mechanic_id := old.mechanic_id;
      new.final_price := old.final_price;
      new.estimated_price := old.estimated_price;
      return new;
    end if;

    -- c) customer approves/rejects the repair estimate
    if old.status = 'WAITING_FOR_APPROVAL' and new.status in ('REPAIRING', 'INSPECTION') then
      new.mechanic_id := old.mechanic_id;
      new.final_price := old.final_price;
      new.estimated_price := old.estimated_price;
      return new;
    end if;

    -- d) customer marks their own payment as recorded
    if old.status = 'PAYMENT_PENDING' and new.status = 'PAID' then
      new.mechanic_id := old.mechanic_id;
      new.final_price := old.final_price;
      new.estimated_price := old.estimated_price;
      return new;
    end if;

    -- anything else: revert the protected columns, let the rest through
    new.status := old.status;
    new.mechanic_id := old.mechanic_id;
    new.final_price := old.final_price;
    new.estimated_price := old.estimated_price;
  end if;

  return new;
end;
$$;

drop trigger if exists service_requests_enforce_customer_update on service_requests;
create trigger service_requests_enforce_customer_update
  before update on service_requests
  for each row execute procedure public.enforce_service_request_customer_update();
