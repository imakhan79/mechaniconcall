-- notifications had select/update policies but no insert policy, so the
-- "new request" notification fired from src/components/request/tracking-view.tsx
-- (requestMechanic) was silently rejected by RLS. Notifications carry no
-- sensitive data on write, so allow any authenticated user to create one.
create policy "notifications_insert_authenticated" on notifications for insert
  with check (auth.role() = 'authenticated');
