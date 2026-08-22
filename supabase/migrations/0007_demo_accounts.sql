-- Demo accounts for one-click login on the /login page.
-- Same approach as 0003_seed.sql: insert directly into auth.users so
-- profiles/customers/mechanics get provisioned by the handle_new_user trigger.
do $$
declare
  demo_customer_id uuid;
  demo_admin_id uuid;
  ahmed_id uuid;
begin
  -- Demo customer
  if not exists (select 1 from auth.users where email = 'demo.customer@mechaniconcall.app') then
    demo_customer_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_customer_id, 'authenticated', 'authenticated',
      'demo.customer@mechaniconcall.app', crypt('DemoPass123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"seed","providers":["seed"]}',
      jsonb_build_object('full_name', 'Demo Customer', 'role', 'customer', 'phone', '+92 300 1112222'),
      false, false,
      '', '', '', '', '', '', '', ''
    );
  end if;

  -- Demo admin
  if not exists (select 1 from auth.users where email = 'demo.admin@mechaniconcall.app') then
    demo_admin_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_admin_id, 'authenticated', 'authenticated',
      'demo.admin@mechaniconcall.app', crypt('DemoPass123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"seed","providers":["seed"]}',
      jsonb_build_object('full_name', 'Demo Admin', 'role', 'admin', 'phone', '+92 300 3334444'),
      false, false,
      '', '', '', '', '', '', '', ''
    );
  end if;

  -- Standardize the existing demo mechanic's password so the one-click
  -- "Try as Mechanic" button on /login has a known credential.
  update auth.users set encrypted_password = crypt('DemoPass123!', gen_salt('bf'))
  where email = 'ahmed.khan@demo.mechaniconcall.app';
end $$;
