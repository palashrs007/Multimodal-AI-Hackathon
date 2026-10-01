-- WanderShot RLS Isolation Verification Script
-- Run this in Supabase SQL editor or psql to verify User A cannot read or mutate User B's trips.

-- 1. Setup test users and data
do $$
declare
  user_a uuid := '11111111-1111-1111-1111-111111111111';
  user_b uuid := '22222222-2222-2222-2222-222222222222';
  trip_b uuid;
  found_count int;
begin
  -- Clear any previous test artifacts
  delete from public.trips where user_id in (user_a, user_b);

  -- Insert trip as User B
  insert into public.trips (
    user_id,
    title,
    duration_days,
    budget_amount,
    budget_currency,
    pace,
    status
  ) values (
    user_b,
    'User B Private Kyoto Trip',
    5,
    75000,
    'INR',
    'balanced',
    'draft'
  ) returning id into trip_b;

  -- 2. Simulate User A context via set_config
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', user_a::text, true);

  -- Attempt to SELECT User B's trip as User A
  select count(*) into found_count
  from public.trips
  where id = trip_b;

  if found_count > 0 then
    raise exception 'RLS FAILURE: User A was able to read User B trip!';
  else
    raise notice 'RLS SUCCESS: User A read 0 records for User B trip as expected.';
  end if;

  -- Attempt to UPDATE User B's trip as User A
  update public.trips set title = 'Hacked by User A' where id = trip_b;
  select count(*) into found_count
  from public.trips
  where id = trip_b and title = 'Hacked by User A';

  if found_count > 0 then
    raise exception 'RLS FAILURE: User A was able to mutate User B trip!';
  else
    raise notice 'RLS SUCCESS: User A could not modify User B trip.';
  end if;

  -- Attempt to DELETE User B's trip as User A
  delete from public.trips where id = trip_b;
  select count(*) into found_count
  from public.trips
  where id = trip_b;

  if found_count = 0 then
    raise exception 'RLS FAILURE: User A was able to delete User B trip!';
  else
    raise notice 'RLS SUCCESS: User A could not delete User B trip.';
  end if;

  -- Clean up
  perform set_config('role', 'postgres', true);
  delete from public.trips where user_id in (user_a, user_b);
  raise notice 'RLS VALIDATION COMPLETE: ALL CHECKS PASSED.';
end $$;
