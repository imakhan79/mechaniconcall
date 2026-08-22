alter publication supabase_realtime add table service_requests;
alter publication supabase_realtime add table mechanic_locations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table service_request_status_history;

alter table service_requests replica identity full;
alter table mechanic_locations replica identity full;
