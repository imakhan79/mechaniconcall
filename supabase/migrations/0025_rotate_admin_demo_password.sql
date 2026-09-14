-- The real admin account's password was committed in plaintext in
-- 0014_reset_to_appointment_portal.sql ('Workshop@2026!'). Rotate it to
-- the same shared demo password already used for the other one-click
-- demo accounts (demo.customer / ahmed.khan), since this account exists
-- purely for public one-click admin demo access to this project.
update auth.users
set encrypted_password = crypt('DemoPass123!', gen_salt('bf'))
where email = 'admin@mechaniconcall.app';
