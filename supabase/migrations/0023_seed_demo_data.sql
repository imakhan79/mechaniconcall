-- Populate every module (bookings, jobs, earnings, payments, reviews,
-- documents, notifications, support, live map) with realistic demo data
-- built on the existing demo accounts, so every dashboard has real
-- content instead of empty states. Idempotent: skips if requests already
-- exist (this migration owns all service_requests it creates).

do $$
declare
  v_customer uuid;
  v_customer2 uuid;
  v_ahmed uuid;
  v_bilal uuid;
  v_usman uuid;
  v_fahad uuid;
  v_zeeshan uuid;

  v_cat_battery uuid; v_cat_tire uuid; v_cat_towing uuid; v_cat_fuel uuid;
  v_cat_diag uuid; v_cat_brake uuid; v_cat_engine uuid; v_cat_ac uuid;

  v_veh1 uuid; v_veh2 uuid; v_veh3 uuid; v_veh4 uuid;

  v_req bigint;
  v_insp uuid;
  v_est uuid;
  v_inv uuid;

  -- helper for building a full completed job: inspection -> estimate ->
  -- invoice -> payment -> earnings -> rating
  procedure_note text;
begin
  if exists (select 1 from service_requests limit 1) then
    raise notice 'service_requests already has data — skipping seed.';
    return;
  end if;

  select id into v_customer from auth.users where email = 'demo.customer@mechaniconcall.app';
  select id into v_customer2 from auth.users where email = 'phase1.customer@example.com';
  select id into v_ahmed from auth.users where email = 'ahmed.khan@demo.mechaniconcall.app';
  select id into v_bilal from auth.users where email = 'bilal@demo.mechaniconcall.app';
  select id into v_usman from auth.users where email = 'usman.raza@demo.mechaniconcall.app';
  select id into v_fahad from auth.users where email = 'fahad@demo.mechaniconcall.app';
  select id into v_zeeshan from auth.users where email = 'zeeshan.malik@demo.mechaniconcall.app';

  if v_customer is null or v_ahmed is null then
    raise notice 'Demo accounts not found — skipping seed.';
    return;
  end if;

  select id into v_cat_battery from service_categories where slug = 'battery-jumpstart';
  select id into v_cat_tire from service_categories where slug = 'flat-tire';
  select id into v_cat_towing from service_categories where slug = 'towing';
  select id into v_cat_fuel from service_categories where slug = 'fuel-delivery';
  select id into v_cat_diag from service_categories where slug = 'diagnostics';
  select id into v_cat_brake from service_categories where slug = 'brake-service';
  select id into v_cat_engine from service_categories where slug = 'engine-repair';
  select id into v_cat_ac from service_categories where slug = 'ac-service';

  -- ---------- mechanic profiles ----------
  update mechanics set business_name = 'Ahmed Khan Auto Repair', specialties = array['Battery','Engine','Diagnostics'],
    is_online = true, current_lat = 25.0805, current_lng = 55.1403, service_radius_km = 20,
    verification_status = 'verified', trust_score = 92
    where id = v_ahmed;
  if v_bilal is not null then
    update mechanics set business_name = 'Bilal Auto Services', specialties = array['Tires','Brakes'],
      is_online = true, current_lat = 25.1972, current_lng = 55.2744, service_radius_km = 15,
      verification_status = 'verified', trust_score = 88 where id = v_bilal;
  end if;
  if v_usman is not null then
    update mechanics set business_name = 'Usman Raza Towing & Repair', specialties = array['Towing','Engine Repair'],
      is_online = true, current_lat = 25.3463, current_lng = 55.4209, service_radius_km = 30,
      verification_status = 'verified', trust_score = 85 where id = v_usman;
  end if;
  if v_fahad is not null then
    update mechanics set business_name = 'Fahad Automotive', specialties = array['AC Service','Diagnostics'],
      is_online = false, current_lat = 24.4539, current_lng = 54.3773, service_radius_km = 20,
      verification_status = 'verified', trust_score = 90 where id = v_fahad;
  end if;
  if v_zeeshan is not null then
    update mechanics set business_name = 'Zeeshan Malik Motors', specialties = array['Fuel Delivery','Battery'],
      is_online = true, current_lat = 24.2075, current_lng = 55.7447, service_radius_km = 18,
      verification_status = 'under_review', trust_score = 40 where id = v_zeeshan;
    insert into mechanic_documents (mechanic_id, doc_type, file_url, status, created_at) values
      (v_zeeshan, 'Emirates ID', 'demo/zeeshan-eid.jpg', 'pending', now() - interval '2 days'),
      (v_zeeshan, 'Trade License', 'demo/zeeshan-license.jpg', 'pending', now() - interval '2 days');
  end if;
  insert into mechanic_documents (mechanic_id, doc_type, file_url, status, created_at) values
    (v_ahmed, 'Emirates ID', 'demo/ahmed-eid.jpg', 'approved', now() - interval '60 days'),
    (v_ahmed, 'Trade License', 'demo/ahmed-license.jpg', 'approved', now() - interval '60 days');

  insert into mechanic_locations (mechanic_id, lat, lng, heading, updated_at) values
    (v_ahmed, 25.0805, 55.1403, 90, now())
    on conflict (mechanic_id) do update set lat = excluded.lat, lng = excluded.lng, updated_at = excluded.updated_at;
  if v_bilal is not null then
    insert into mechanic_locations (mechanic_id, lat, lng, heading, updated_at) values (v_bilal, 25.1972, 55.2744, 180, now())
      on conflict (mechanic_id) do update set lat = excluded.lat, lng = excluded.lng, updated_at = excluded.updated_at;
  end if;
  if v_usman is not null then
    insert into mechanic_locations (mechanic_id, lat, lng, heading, updated_at) values (v_usman, 25.3463, 55.4209, 45, now())
      on conflict (mechanic_id) do update set lat = excluded.lat, lng = excluded.lng, updated_at = excluded.updated_at;
  end if;

  -- ---------- vehicles ----------
  insert into vehicles (customer_id, vehicle_type, make, model, year, registration_number, created_at)
    values (v_customer, 'car', 'Toyota', 'Land Cruiser', 2023, 'Dubai A 12345', now() - interval '90 days')
    returning id into v_veh1;
  insert into vehicles (customer_id, vehicle_type, make, model, year, registration_number, created_at)
    values (v_customer, 'car', 'Nissan', 'Patrol', 2022, 'Dubai B 67890', now() - interval '60 days')
    returning id into v_veh2;
  insert into vehicles (customer_id, vehicle_type, make, model, year, registration_number, created_at)
    values (v_customer, 'car', 'Honda', 'Civic', 2021, 'Sharjah C 24680', now() - interval '30 days')
    returning id into v_veh3;
  if v_customer2 is not null then
    insert into vehicles (customer_id, vehicle_type, make, model, year, registration_number, created_at)
      values (v_customer2, 'car', 'Lexus', 'LX 600', 2024, 'Abu Dhabi D 11223', now() - interval '20 days')
      returning id into v_veh4;
  end if;

  -- =========================================================
  -- Completed job #1 — Ahmed Khan, Battery Jumpstart, 20 days ago
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
    values (v_customer, v_veh1, v_cat_battery, v_ahmed, 'PAID', true, 25.081, 55.141, 'Dubai Marina Walk, Dubai',
      'Car won''t start, battery seems dead.', 150, 180, now() - interval '20 days', now() - interval '20 days' + interval '5 min',
      now() - interval '20 days' + interval '20 min', now() - interval '20 days' + interval '50 min', now() - interval '20 days')
    returning id into v_req;
  insert into inspections (request_id, mechanic_id, notes, created_at) values (v_req, v_ahmed, 'Battery voltage very low, terminals corroded.', now() - interval '20 days')
    returning id into v_insp;
  insert into inspection_items (inspection_id, category, item, is_ok, note) values
    (v_insp, 'Electrical', 'Battery voltage', false, 'Reads 9.2V, needs jump + inspection'),
    (v_insp, 'Electrical', 'Alternator', true, null);
  insert into repair_estimates (request_id, labor_total, parts_total, service_fee, tax_total, grand_total, status, created_at)
    values (v_req, 50, 80, 30, 20, 180, 'approved', now() - interval '20 days')
    returning id into v_est;
  insert into estimate_items (estimate_id, kind, name, quantity, unit_price) values
    (v_est, 'labor', 'Battery jump start & test', 1, 50),
    (v_est, 'part', 'Terminal cleaning kit', 1, 80);
  insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
    values ('INV-2026-0001', v_req, v_customer, v_ahmed, 160, 20, 0, 180, 'apple_pay', now() - interval '20 days')
    returning id into v_inv;
  insert into invoice_items (invoice_id, description, quantity, unit_price) values
    (v_inv, 'Battery jump start & test', 1, 50), (v_inv, 'Terminal cleaning kit', 1, 80), (v_inv, 'Service fee', 1, 30);
  insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'apple_pay', 'completed', 180, now() - interval '20 days');
  insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_ahmed, v_req, 180, 27, 153, now() - interval '20 days');
  insert into ratings (request_id, customer_id, mechanic_id, overall, quality, punctuality, professionalism, pricing, communication, review, created_at)
    values (v_req, v_customer, v_ahmed, 5, 5, 5, 5, 4, 5, 'Battery died at 11pm on Sheikh Zayed Road. A mechanic was there in 18 minutes. Incredible service.', now() - interval '20 days');

  -- =========================================================
  -- Completed job #2 — Ahmed Khan, Diagnostics, 10 days ago
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
    values (coalesce(v_customer2, v_customer), coalesce(v_veh4, v_veh1), v_cat_diag, v_ahmed, 'PAID', false, 24.454, 54.378, 'Corniche Road, Abu Dhabi',
      'Check engine light is on.', 220, 240, now() - interval '10 days', now() - interval '10 days' + interval '10 min',
      now() - interval '10 days' + interval '35 min', now() - interval '10 days' + interval '80 min', now() - interval '10 days')
    returning id into v_req;
  insert into inspections (request_id, mechanic_id, notes, created_at) values (v_req, v_ahmed, 'OBD scan shows O2 sensor fault code.', now() - interval '10 days') returning id into v_insp;
  insert into inspection_items (inspection_id, category, item, is_ok, note) values (v_insp, 'Engine', 'O2 sensor', false, 'Fault code P0141');
  insert into repair_estimates (request_id, labor_total, parts_total, service_fee, tax_total, grand_total, status, created_at)
    values (v_req, 100, 100, 30, 10, 240, 'approved', now() - interval '10 days') returning id into v_est;
  insert into estimate_items (estimate_id, kind, name, quantity, unit_price) values (v_est, 'labor', 'Full OBD diagnostic scan', 1, 100), (v_est, 'part', 'O2 sensor replacement', 1, 100);
  insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
    values ('INV-2026-0002', v_req, coalesce(v_customer2, v_customer), v_ahmed, 230, 10, 0, 240, 'e_and_money', now() - interval '10 days') returning id into v_inv;
  insert into invoice_items (invoice_id, description, quantity, unit_price) values (v_inv, 'Full OBD diagnostic scan', 1, 100), (v_inv, 'O2 sensor replacement', 1, 100), (v_inv, 'Service fee', 1, 30);
  insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'e_and_money', 'completed', 240, now() - interval '10 days');
  insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_ahmed, v_req, 240, 36, 204, now() - interval '10 days');
  insert into ratings (request_id, customer_id, mechanic_id, overall, quality, punctuality, professionalism, pricing, communication, review, created_at)
    values (v_req, coalesce(v_customer2, v_customer), v_ahmed, 5, 5, 5, 5, 5, 5, 'Transparent pricing, live tracking, and the mechanic was genuinely professional. Will use again.', now() - interval '10 days');

  -- =========================================================
  -- Completed job #3 — Ahmed Khan, AC Service, 5 days ago (lower rating)
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
    values (v_customer, v_veh2, v_cat_ac, v_ahmed, 'PAID', false, 25.09, 55.15, 'JBR, Dubai',
      'AC blowing warm air.', 260, 260, now() - interval '5 days', now() - interval '5 days' + interval '15 min',
      now() - interval '5 days' + interval '45 min', now() - interval '5 days' + interval '100 min', now() - interval '5 days')
    returning id into v_req;
  insert into inspections (request_id, mechanic_id, notes, created_at) values (v_req, v_ahmed, 'Refrigerant low, minor leak at compressor seal.', now() - interval '5 days') returning id into v_insp;
  insert into inspection_items (inspection_id, category, item, is_ok, note) values (v_insp, 'AC System', 'Refrigerant level', false, 'Recharged and sealed');
  insert into repair_estimates (request_id, labor_total, parts_total, service_fee, tax_total, grand_total, status, created_at)
    values (v_req, 120, 100, 30, 10, 260, 'approved', now() - interval '5 days') returning id into v_est;
  insert into estimate_items (estimate_id, kind, name, quantity, unit_price) values (v_est, 'labor', 'AC recharge & leak seal', 1, 120), (v_est, 'part', 'Refrigerant (R134a)', 1, 100);
  insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
    values ('INV-2026-0003', v_req, v_customer, v_ahmed, 250, 10, 0, 260, 'card', now() - interval '5 days') returning id into v_inv;
  insert into invoice_items (invoice_id, description, quantity, unit_price) values (v_inv, 'AC recharge & leak seal', 1, 120), (v_inv, 'Refrigerant (R134a)', 1, 100), (v_inv, 'Service fee', 1, 30);
  insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'card', 'completed', 260, now() - interval '5 days');
  insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_ahmed, v_req, 260, 39, 221, now() - interval '5 days');
  insert into ratings (request_id, customer_id, mechanic_id, overall, quality, punctuality, professionalism, pricing, communication, review, created_at)
    values (v_req, v_customer, v_ahmed, 4, 4, 3, 4, 3, 4, 'Fixed the AC but arrived a bit later than the estimated time. Work quality was good.', now() - interval '5 days');

  -- =========================================================
  -- Active job — Ahmed Khan, Engine Repair, REPAIRING (today)
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, created_at, accepted_at, arrived_at, updated_at)
    values (v_customer, v_veh1, v_cat_engine, v_ahmed, 'REPAIRING', false, 25.08, 55.14, 'Dubai Marina, Dubai',
      'Loud knocking noise from engine bay.', 900, now() - interval '3 hours', now() - interval '2 hours 40 min',
      now() - interval '2 hours', now() - interval '1 hour')
    returning id into v_req;
  insert into inspections (request_id, mechanic_id, notes, created_at) values (v_req, v_ahmed, 'Worn engine mount causing knocking under load.', now() - interval '2 hours') returning id into v_insp;
  insert into inspection_items (inspection_id, category, item, is_ok, note) values (v_insp, 'Engine', 'Engine mounts', false, 'Front mount worn, needs replacement');
  insert into repair_estimates (request_id, labor_total, parts_total, service_fee, tax_total, grand_total, status, created_at)
    values (v_req, 400, 420, 50, 30, 900, 'approved', now() - interval '90 min') returning id into v_est;
  insert into estimate_items (estimate_id, kind, name, quantity, unit_price) values (v_est, 'labor', 'Engine mount replacement', 1, 400), (v_est, 'part', 'OEM engine mount', 1, 420);
  insert into messages (request_id, sender_id, body, created_at) values
    (v_req, v_customer, 'How long will this take?', now() - interval '80 min'),
    (v_req, v_ahmed, 'About 1.5 hours total, replacing the front engine mount now.', now() - interval '75 min'),
    (v_req, v_ahmed, 'Almost done, just torquing the final bolts.', now() - interval '10 min');

  -- =========================================================
  -- Live job — Ahmed Khan, Battery Jumpstart, MECHANIC_ON_THE_WAY (today, emergency)
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, created_at, accepted_at, updated_at)
    values (v_customer, v_veh3, v_cat_battery, v_ahmed, 'MECHANIC_ON_THE_WAY', true, 25.076, 55.138, 'Dubai Internet City, Dubai',
      'Battery dead in office parking lot.', 180, now() - interval '12 min', now() - interval '9 min', now() - interval '2 min')
    returning id into v_req;
  insert into mechanic_locations (mechanic_id, request_id, lat, lng, heading, updated_at)
    values (v_ahmed, v_req, 25.079, 55.140, 220, now())
    on conflict (mechanic_id) do update set request_id = excluded.request_id, lat = excluded.lat, lng = excluded.lng, updated_at = excluded.updated_at;

  -- =========================================================
  -- Waiting for approval — Ahmed Khan, Brake Service (today)
  -- =========================================================
  insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
      description, estimated_price, created_at, accepted_at, arrived_at, updated_at)
    values (coalesce(v_customer2, v_customer), coalesce(v_veh4, v_veh2), v_cat_brake, v_ahmed, 'WAITING_FOR_APPROVAL', false, 24.46, 54.38, 'Al Reem Island, Abu Dhabi',
      'Brakes squeaking, pedal feels soft.', 480, now() - interval '50 min', now() - interval '45 min', now() - interval '20 min', now() - interval '5 min')
    returning id into v_req;
  insert into inspections (request_id, mechanic_id, notes, created_at) values (v_req, v_ahmed, 'Front brake pads worn to 2mm, rotors scored.', now() - interval '15 min') returning id into v_insp;
  insert into inspection_items (inspection_id, category, item, is_ok, note) values
    (v_insp, 'Brakes', 'Front pads', false, '2mm remaining, replace now'),
    (v_insp, 'Brakes', 'Rotors', false, 'Light scoring, resurface recommended');
  insert into repair_estimates (request_id, labor_total, parts_total, service_fee, tax_total, grand_total, status, created_at)
    values (v_req, 150, 280, 30, 20, 480, 'pending', now() - interval '10 min') returning id into v_est;
  insert into estimate_items (estimate_id, kind, name, quantity, unit_price) values (v_est, 'labor', 'Front brake pad & rotor service', 1, 150), (v_est, 'part', 'Brake pads + rotors (front pair)', 1, 280);

  -- =========================================================
  -- Other mechanics — completed jobs for variety
  -- =========================================================
  if v_bilal is not null then
    insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
        description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
      values (v_customer, v_veh3, v_cat_tire, v_bilal, 'PAID', true, 25.2, 55.27, 'Sheikh Zayed Road, Dubai',
        'Flat tire on the highway.', 120, 130, now() - interval '15 days', now() - interval '15 days' + interval '8 min',
        now() - interval '15 days' + interval '25 min', now() - interval '15 days' + interval '45 min', now() - interval '15 days')
      returning id into v_req;
    insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
      values ('INV-2026-0004', v_req, v_customer, v_bilal, 120, 10, 0, 130, 'careem_pay', now() - interval '15 days') returning id into v_inv;
    insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'careem_pay', 'completed', 130, now() - interval '15 days');
    insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_bilal, v_req, 130, 19.5, 110.5, now() - interval '15 days');
    insert into ratings (request_id, customer_id, mechanic_id, overall, review, created_at)
      values (v_req, v_customer, v_bilal, 5, 'Flat tire on the highway and I was back on the road in under 30 minutes. Highly recommend.', now() - interval '15 days');

    -- cancelled job
    insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
        description, estimated_price, created_at, accepted_at, cancelled_at, updated_at)
      values (v_customer, v_veh2, v_cat_brake, v_bilal, 'CANCELLED', false, 25.19, 55.27, 'Downtown Dubai',
        'Brake noise, requested inspection.', 350, now() - interval '4 days', now() - interval '4 days' + interval '5 min',
        now() - interval '4 days' + interval '15 min', now() - interval '4 days')
      returning id into v_req;
  end if;

  if v_usman is not null then
    insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
        description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
      values (v_customer, v_veh1, v_cat_towing, v_usman, 'PAID', true, 25.35, 55.42, 'Al Nahda, Sharjah',
        'Car won''t start, needs towing to garage.', 300, 320, now() - interval '12 days', now() - interval '12 days' + interval '10 min',
        now() - interval '12 days' + interval '40 min', now() - interval '12 days' + interval '90 min', now() - interval '12 days')
      returning id into v_req;
    insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
      values ('INV-2026-0005', v_req, v_customer, v_usman, 310, 10, 0, 320, 'payit', now() - interval '12 days') returning id into v_inv;
    insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'payit', 'completed', 320, now() - interval '12 days');
    insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_usman, v_req, 320, 48, 272, now() - interval '12 days');
    insert into ratings (request_id, customer_id, mechanic_id, overall, review, created_at) values (v_req, v_customer, v_usman, 3, 'Got the job done but communication could have been better.', now() - interval '12 days');
    insert into payouts (mechanic_id, amount, status, requested_at, paid_at) values (v_usman, 272, 'paid', now() - interval '11 days', now() - interval '10 days');
  end if;

  if v_fahad is not null then
    insert into service_requests (customer_id, vehicle_id, category_id, mechanic_id, status, is_emergency, lat, lng, address,
        description, estimated_price, final_price, created_at, accepted_at, arrived_at, completed_at, updated_at)
      values (coalesce(v_customer2, v_customer), coalesce(v_veh4, v_veh1), v_cat_ac, v_fahad, 'PAID', false, 24.47, 54.37, 'Khalifa City, Abu Dhabi',
        'AC not cooling at all.', 240, 240, now() - interval '8 days', now() - interval '8 days' + interval '20 min',
        now() - interval '8 days' + interval '50 min', now() - interval '8 days' + interval '110 min', now() - interval '8 days')
      returning id into v_req;
    insert into invoices (invoice_number, request_id, customer_id, mechanic_id, subtotal, tax, discount, total, payment_method, created_at)
      values ('INV-2026-0006', v_req, coalesce(v_customer2, v_customer), v_fahad, 230, 10, 0, 240, 'cash', now() - interval '8 days') returning id into v_inv;
    insert into payments (invoice_id, request_id, method, status, amount, created_at) values (v_inv, v_req, 'cash', 'completed', 240, now() - interval '8 days');
    insert into mechanic_earnings (mechanic_id, request_id, gross_amount, platform_fee, net_amount, created_at) values (v_fahad, v_req, 240, 36, 204, now() - interval '8 days');
    insert into ratings (request_id, customer_id, mechanic_id, overall, review, created_at) values (v_req, coalesce(v_customer2, v_customer), v_fahad, 5, 'Excellent, professional service. Highly recommended.', now() - interval '8 days');
    insert into payouts (mechanic_id, amount, status, requested_at) values (v_fahad, 204, 'requested', now() - interval '1 day');
  end if;

  -- unassigned cancelled request
  insert into service_requests (customer_id, vehicle_id, category_id, status, is_emergency, lat, lng, address, description, estimated_price, created_at, cancelled_at, updated_at)
    values (v_customer, v_veh2, v_cat_fuel, 'CANCELLED', true, 25.1, 55.17, 'Business Bay, Dubai', 'Ran out of fuel.', 100,
      now() - interval '6 days', now() - interval '6 days' + interval '3 min', now() - interval '6 days');

  -- open, unassigned SEARCHING request (for live map + customer "nearby mechanics" demo)
  insert into service_requests (customer_id, vehicle_id, category_id, status, is_emergency, lat, lng, address, description, estimated_price, created_at, updated_at)
    values (v_customer, v_veh3, v_cat_tire, 'SEARCHING', true, 25.085, 55.145, 'Dubai Marina, Dubai', 'Flat tire, need urgent help.', 120,
      now() - interval '4 min', now() - interval '4 min');

  -- ---------- notifications ----------
  insert into notifications (user_id, type, title, body, read_at, created_at) values
    (v_customer, 'booking_confirmed', 'Mechanic assigned', 'Ahmed Khan has been assigned to your battery jumpstart request.', now() - interval '19 days', now() - interval '20 days'),
    (v_customer, 'payment_received', 'Payment successful', 'Your payment of AED 180 via Apple Pay was received.', now() - interval '19 days', now() - interval '20 days'),
    (v_customer, 'mechanic_on_the_way', 'Ahmed Khan is on the way', 'ETA 9 minutes to Dubai Internet City.', null, now() - interval '9 min'),
    (v_customer, 'estimate_ready', 'Repair estimate ready', 'Review and approve the brake service estimate for AED 480.', null, now() - interval '10 min'),
    (v_ahmed, 'new_request', 'New emergency request nearby', 'Battery jumpstart request 0.4km away in Dubai Marina.', null, now() - interval '4 min'),
    (v_ahmed, 'payout_processed', 'Payout requested', 'Your payout request for AED 204 is being processed.', now() - interval '12 hours', now() - interval '1 day'),
    (v_ahmed, 'rating_received', 'New 5-star rating', 'Demo Customer rated your last job 5 stars.', now() - interval '10 days', now() - interval '10 days');

  -- ---------- support tickets ----------
  insert into support_tickets (user_id, subject, category, priority, status, message, created_at) values
    (v_customer, 'Invoice discrepancy', 'billing', 'normal', 'resolved', 'The invoice total for my AC service didn''t match the approved estimate. Please check.', now() - interval '4 days'),
    (v_customer, 'Mechanic arrived late', 'service', 'low', 'closed', 'Mechanic was about 15 minutes later than the ETA shown in the app.', now() - interval '9 days'),
    (v_ahmed, 'Payout delayed', 'payments', 'high', 'in_progress', 'My payout request from 2 days ago is still showing as requested.', now() - interval '1 day'),
    (v_customer, 'Cannot update vehicle details', 'account', 'normal', 'open', 'I''m unable to edit the registration number on my Honda Civic.', now() - interval '2 hours');
end $$;
