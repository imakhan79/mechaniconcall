-- The 0014 -> 0016 schema reset dropped and recreated profiles/customers/
-- mechanics from scratch, but several auth.users rows from the original
-- 0003/0007 seeds survived and were never re-provisioned (the
-- on_marketplace_user_created trigger only fires on INSERT, not
-- retroactively) — leaving their demo logins broken (customer/mechanic
-- layouts redirect to /login when no profiles row exists). Backfill them.

do $$
declare
  u record;
  v_role user_role;
begin
  for u in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join profiles p on p.id = au.id
    where p.id is null
  loop
    v_role := case
      when u.raw_user_meta_data->>'role' = 'mechanic' then 'mechanic'
      when u.raw_user_meta_data->>'role' = 'customer' then 'customer'
      when u.email like '%mechaniconcall.app' and u.email like '%demo.mechaniconcall.app' then 'mechanic'
      else 'customer'
    end;

    insert into profiles (id, role, full_name, phone)
    values (
      u.id, v_role,
      coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
      u.raw_user_meta_data->>'phone'
    )
    on conflict (id) do nothing;

    if v_role = 'mechanic' then
      insert into mechanics (id, verification_status, is_online)
      values (u.id, 'verified', false)
      on conflict (id) do nothing;
    else
      insert into customers (id) values (u.id) on conflict (id) do nothing;
    end if;
  end loop;
end $$;
