-- WanderShot Row Level Security (RLS) Policies
-- Migration: 002_rls.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_images enable row level security;
alter table public.extracted_places enable row level security;
alter table public.itineraries enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_activities enable row level security;
alter table public.ai_request_logs enable row level security;

-- PROFILES Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- TRIPS Policies
create policy "Users can view own trips"
  on public.trips for select
  using (user_id = auth.uid());

create policy "Users can insert own trips"
  on public.trips for insert
  with check (user_id = auth.uid());

create policy "Users can update own trips"
  on public.trips for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own trips"
  on public.trips for delete
  using (user_id = auth.uid());

-- TRIP IMAGES Policies
create policy "Users can view own trip images"
  on public.trip_images for select
  using (user_id = auth.uid());

create policy "Users can insert own trip images"
  on public.trip_images for insert
  with check (user_id = auth.uid());

create policy "Users can update own trip images"
  on public.trip_images for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own trip images"
  on public.trip_images for delete
  using (user_id = auth.uid());

-- EXTRACTED PLACES Policies
create policy "Users can view own extracted places"
  on public.extracted_places for select
  using (user_id = auth.uid());

create policy "Users can insert own extracted places"
  on public.extracted_places for insert
  with check (user_id = auth.uid());

create policy "Users can update own extracted places"
  on public.extracted_places for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own extracted places"
  on public.extracted_places for delete
  using (user_id = auth.uid());

-- ITINERARIES Policies
create policy "Users can view own itineraries"
  on public.itineraries for select
  using (user_id = auth.uid());

create policy "Users can insert own itineraries"
  on public.itineraries for insert
  with check (user_id = auth.uid());

create policy "Users can update own itineraries"
  on public.itineraries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own itineraries"
  on public.itineraries for delete
  using (user_id = auth.uid());

-- ITINERARY DAYS Policies
create policy "Users can view own itinerary days"
  on public.itinerary_days for select
  using (user_id = auth.uid());

create policy "Users can insert own itinerary days"
  on public.itinerary_days for insert
  with check (user_id = auth.uid());

create policy "Users can update own itinerary days"
  on public.itinerary_days for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own itinerary days"
  on public.itinerary_days for delete
  using (user_id = auth.uid());

-- ITINERARY ACTIVITIES Policies
create policy "Users can view own activities"
  on public.itinerary_activities for select
  using (user_id = auth.uid());

create policy "Users can insert own activities"
  on public.itinerary_activities for insert
  with check (user_id = auth.uid());

create policy "Users can update own activities"
  on public.itinerary_activities for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own activities"
  on public.itinerary_activities for delete
  using (user_id = auth.uid());

-- AI REQUEST LOGS Policies (Insert and select by user; no update/delete)
create policy "Users can view own ai logs"
  on public.ai_request_logs for select
  using (user_id = auth.uid());

create policy "Users can insert own ai logs"
  on public.ai_request_logs for insert
  with check (user_id = auth.uid());

-- STORAGE POLICIES (bucket: trip-uploads)
-- Path convention: {user_id}/{trip_id}/...
create policy "Authenticated users can select own trip uploads"
  on storage.objects for select
  using (
    bucket_id = 'trip-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can insert own trip uploads"
  on storage.objects for insert
  with check (
    bucket_id = 'trip-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Authenticated users can delete own trip uploads"
  on storage.objects for delete
  using (
    bucket_id = 'trip-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
