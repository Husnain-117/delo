-- Allow newly signed-in users to self-assign roles during signup
-- DEVELOPMENT MODE: Includes admin/manager for testing
-- PRODUCTION: Change to only ('customer','waiter','chef')
create policy "Self-assign limited roles on signup"
  on public.user_roles for insert
  with check (
    auth.uid() = user_id
    and role in ('customer','waiter','chef','manager','admin')
  );
