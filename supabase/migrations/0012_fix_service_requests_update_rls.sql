-- Two real bugs found via QA:
--
-- 1) "service_requests_update_participants_or_admin" had no explicit WITH CHECK,
--    so Postgres defaulted it to the same as USING. Rejecting a job (mechanic
--    sets mechanic_id = null) produces a NEW row where the acting mechanic no
--    longer satisfies `mechanic_id = auth.uid()`, and customer_id was never
--    theirs either — so the WITH CHECK silently failed the update (0 rows
--    affected, no error, since supabase-js update() wasn't chained with
--    .select() to surface the mismatch).
--
-- 2) There was no UPDATE policy letting a mechanic claim an unassigned
--    SEARCHING request at all (src/components/mechanic/mechanic-overview.tsx
--    grabOpenJob) — USING required the actor to already be customer_id or
--    mechanic_id on the OLD row, which is never true for an open request.
drop policy "service_requests_update_participants_or_admin" on service_requests;
create policy "service_requests_update_participants_or_admin" on service_requests for update
  using (customer_id = auth.uid() or mechanic_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or is_admin() or mechanic_id = auth.uid() or mechanic_id is null);

create policy "service_requests_mechanic_claim_open" on service_requests for update
  using (status = 'SEARCHING' and mechanic_id is null and exists (select 1 from mechanics m where m.id = auth.uid()))
  with check (mechanic_id = auth.uid());
