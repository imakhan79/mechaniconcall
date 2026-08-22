-- Seed: service categories
insert into service_categories (name, slug, icon, base_price, is_emergency, sort_order) values
  ('Engine Problem','engine-problem','engine',1500,false,1),
  ('Flat Tire','flat-tire','tire',800,false,2),
  ('Battery Jump Start','battery-jump-start','battery',600,false,3),
  ('Battery Replacement','battery-replacement','battery-full',2000,false,4),
  ('Oil Change','oil-change','droplet',1200,false,5),
  ('Brake Problem','brake-problem','disc',1500,false,6),
  ('AC Repair','ac-repair','wind',1800,false,7),
  ('Overheating','overheating','thermometer',1000,true,8),
  ('Fuel Delivery','fuel-delivery','fuel',700,true,9),
  ('Lockout Assistance','lockout-assistance','lock',900,true,10),
  ('Towing','towing','truck',3000,true,11),
  ('Electrical Problem','electrical-problem','zap',1400,false,12),
  ('Diagnostic Scan','diagnostic-scan','scan',1000,false,13),
  ('Accident Assistance','accident-assistance','alert-triangle',0,true,14)
on conflict (slug) do nothing;

-- Seed: demo mechanics (with backing auth.users rows so profiles/mechanics FKs are satisfiable)
do $$
declare
  m record;
  new_id uuid;
begin
  for m in select * from (values
    ('Ahmed Khan','ahmed.khan@demo.mechaniconcall.app', array['Engine','Electrical','Diagnostics'], 24.8607, 67.0011, 4.9, 128, 'Ahmed Auto Works'),
    ('Bilal Auto Services','bilal@demo.mechaniconcall.app', array['Tires','Brakes','Suspension'], 24.8735, 67.0298, 4.8, 96, 'Bilal Auto Services'),
    ('Usman Raza','usman.raza@demo.mechaniconcall.app', array['AC Repair','Electrical'], 24.8482, 67.0298, 4.7, 61, 'Usman Cool Care'),
    ('Fahad Automotive','fahad@demo.mechaniconcall.app', array['Towing','Engine','Overheating'], 24.9056, 67.0822, 4.6, 74, 'Fahad Automotive'),
    ('Zeeshan Malik','zeeshan.malik@demo.mechaniconcall.app', array['Battery','Diagnostics','Lockout'], 24.8138, 67.0300, 4.9, 152, 'Zeeshan Roadside')
  ) as t(full_name, email, specialties, lat, lng, rating_avg, rating_count, business_name)
  loop
    new_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      m.email, crypt('demo-password-not-for-login', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"seed","providers":["seed"]}', jsonb_build_object('full_name', m.full_name),
      false, false,
      '', '', '', '', '', '', '', ''
    );

    insert into profiles (id, role, full_name, phone)
      values (new_id, 'mechanic', m.full_name, '+92 300 0000000');

    insert into mechanics (
      id, business_name, bio, specialties, service_radius_km, is_online,
      current_lat, current_lng, rating_avg, rating_count, trust_score, verification_status
    ) values (
      new_id, m.business_name, 'Experienced roadside mechanic serving Karachi.', m.specialties, 15, true,
      m.lat, m.lng, m.rating_avg, m.rating_count, m.rating_avg * 20, 'verified'
    );

    insert into mechanic_locations (mechanic_id, lat, lng)
      values (new_id, m.lat, m.lng);
  end loop;
end $$;
