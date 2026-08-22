insert into storage.buckets (id, name, public)
values
  ('service-media', 'service-media', true),
  ('mechanic-documents', 'mechanic-documents', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "service_media_public_read" on storage.objects for select
  using (bucket_id = 'service-media');
create policy "service_media_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'service-media' and auth.role() = 'authenticated');

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars_owner_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "mechanic_documents_owner_rw" on storage.objects for select
  using (bucket_id = 'mechanic-documents' and (owner = auth.uid() or is_admin()));
create policy "mechanic_documents_owner_upload" on storage.objects for insert
  with check (bucket_id = 'mechanic-documents' and auth.role() = 'authenticated');
