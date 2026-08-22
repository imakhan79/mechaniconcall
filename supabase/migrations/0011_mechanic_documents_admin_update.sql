create policy "mechanic_documents_admin_update" on mechanic_documents for update
  using (is_admin());
