-- 0002_rls.sql only granted SELECT on invoices/invoice_items/mechanic_earnings,
-- so RLS silently blocked the mechanic's own INSERTs when completing a job
-- (JobWorkspace.completeJob in src/components/mechanic/job-workspace.tsx).
create policy "invoices_insert_mechanic" on invoices for insert
  with check (mechanic_id = auth.uid());

create policy "invoice_items_insert_via_invoice" on invoice_items for insert
  with check (exists (select 1 from invoices i where i.id = invoice_id and i.mechanic_id = auth.uid()));

create policy "earnings_insert_own" on mechanic_earnings for insert
  with check (mechanic_id = auth.uid());
