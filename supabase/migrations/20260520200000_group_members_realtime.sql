-- Enable realtime for group_members so that all devices in a group
-- receive live updates when someone joins or leaves.
alter publication supabase_realtime add table public.group_members;
