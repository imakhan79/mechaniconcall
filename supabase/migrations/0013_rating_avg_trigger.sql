-- mechanics.rating_avg/rating_count were seed-only values with nothing
-- keeping them in sync as real ratings come in (found while checking why
-- admin analytics showed 0.0 satisfaction despite a rating existing).
create or replace function refresh_mechanic_rating() returns trigger as $$
begin
  update mechanics
  set rating_avg = (select coalesce(avg(overall), 0) from ratings where mechanic_id = new.mechanic_id),
      rating_count = (select count(*) from ratings where mechanic_id = new.mechanic_id)
  where id = new.mechanic_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_rating_created on ratings;
create trigger on_rating_created
  after insert on ratings
  for each row execute procedure refresh_mechanic_rating();
