-- GoTrue scans several auth.users text columns as non-nullable; leaving them
-- NULL (as our manual seed inserts did) breaks password grant with a generic
-- "Database error querying schema". Backfill to '' for all seeded users, and
-- keep this defensive default in mind for any future direct auth.users insert.
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change is null
   or email_change_token_new is null;
