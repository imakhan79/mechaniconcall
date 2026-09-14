-- Enable Realtime for the marketplace tables the UI subscribes to
-- (tracking-view.tsx and chat-panel.tsx). Missed in 0016 — verified live
-- that writes succeeded via RLS but the UI never received the change
-- without a manual reload, because none of these tables were in the
-- supabase_realtime publication.

alter publication supabase_realtime add table service_requests;
alter publication supabase_realtime add table mechanic_locations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table service_request_status_history;

alter table service_requests replica identity full;
alter table mechanic_locations replica identity full;
