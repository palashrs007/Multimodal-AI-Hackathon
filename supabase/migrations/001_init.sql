-- WanderShot Database Schema Initial Migration
create extension if not exists "pgcrypto";

-- ENUMS
create type public.trip_status as enum (
  'draft',
  'analyzing',
  'review',
  'generating',
  'ready',
  'error'
);

create type public.travel_pace as enum (
  'relaxed',
  'balanced',
  'packed'
);

create type public.place_category as enum (
  'food_cafe',
  'nature_outdoors',
  'beach',
  'culture_heritage',
  'religious_spiritual',
  'museum_art',
  'nightlife',
  'shopping_market',
  'adventure_sports',
  'wellness_spa',
  'viewpoint_photo_spot',
  'stay_accommodation',
  'local_experience',
  'transport_hub',
  'other'
);

create type public.analysis_status as enum (
  'pending',
  'done',
  'failed'
);

-- updated_at trigger helper
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  default_currency char(3) not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- TRIPS
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  destination_hint text check (char_length(destination_hint) <= 100),
  duration_days smallint not null check (duration_days between 1 and 30),
  budget_amount numeric(12, 2) not null check (budget_amount > 0),
  budget_currency char(3) not null default 'INR',
  travelers smallint not null default 1 check (travelers between 1 and 20),
  pace public.travel_pace not null default 'balanced',
  start_date date,
  note_text text check (char_length(note_text) <= 2000),
  voice_note_path text,
  voice_transcript text,
  interests text[] not null default '{}',
  dietary_or_access_notes text check (char_length(dietary_or_access_notes) <= 300),
  parsed_constraints jsonb,
  status public.trip_status not null default 'draft',
  error_message text,
  is_shared boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_user_created on public.trips (user_id, created_at desc);
create index idx_trips_share_token on public.trips (share_token) where share_token is not null;

create trigger trg_trips_updated before update on public.trips
for each row execute function public.set_updated_at();

-- TRIP IMAGES
create table public.trip_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null default 0,
  storage_path text not null,
  original_filename text,
  mime_type text not null,
  size_bytes integer not null,
  source_platform text not null default 'unknown' check (source_platform in ('instagram', 'pinterest', 'other', 'unknown')),
  analysis_status public.analysis_status not null default 'pending',
  analysis jsonb,
  created_at timestamptz not null default now()
);

create index idx_trip_images_trip on public.trip_images (trip_id, position);

-- EXTRACTED PLACES (editable by user at review step)
create table public.extracted_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_id uuid references public.trip_images(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  is_identified boolean not null default true,
  category public.place_category not null default 'other',
  city text,
  region text,
  country text,
  confidence numeric(3, 2) check (confidence between 0 and 1),
  style_tags text[] not null default '{}',
  description text,
  approx_lat numeric(9, 6),
  approx_lng numeric(9, 6),
  included boolean not null default true,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_extracted_places_trip on public.extracted_places (trip_id);
create trigger trg_extracted_places_updated before update on public.extracted_places
for each row execute function public.set_updated_at();

-- ITINERARIES (versioned)
create table public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  title text,
  summary text,
  destination text,
  currency char(3) not null,
  total_estimated_cost numeric(12, 2) not null default 0,
  budget_status text not null check (budget_status in ('within_budget', 'near_limit', 'over_budget')),
  warnings text[] not null default '{}',
  model_name text,
  raw_ai_response jsonb,
  created_at timestamptz not null default now(),
  unique (trip_id, version)
);

create index idx_itineraries_trip on public.itineraries (trip_id, version desc);

-- ITINERARY DAYS
create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number smallint not null check (day_number >= 1),
  title text not null,
  theme text,
  date date,
  daily_estimated_cost numeric(12, 2) not null default 0,
  notes text,
  unique (itinerary_id, day_number)
);

-- ITINERARY ACTIVITIES
create table public.itinerary_activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order smallint not null,
  start_time time,
  end_time time,
  title text not null,
  place_name text not null,
  category public.place_category not null default 'other',
  description text,
  estimated_cost numeric(12, 2) not null default 0 check (estimated_cost >= 0),
  travel_minutes_from_previous smallint check (travel_minutes_from_previous >= 0),
  maps_query text,
  tips text,
  booking_recommended boolean not null default false,
  source_image_id uuid references public.trip_images(id) on delete set null,
  extracted_place_id uuid references public.extracted_places(id) on delete set null,
  is_ai_suggested boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_activities_day on public.itinerary_activities (day_id, sort_order);
create trigger trg_activities_updated before update on public.itinerary_activities
for each row execute function public.set_updated_at();

-- AI REQUEST LOGS (metadata only, never store prompts or images)
create table public.ai_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  kind text not null check (kind in ('image_analysis', 'constraint_parsing', 'itinerary_generation', 'day_regeneration', 'activity_swap')),
  model text,
  latency_ms integer,
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create index idx_ai_logs_user_time on public.ai_request_logs (user_id, created_at desc);

-- STORAGE BUCKET CONFIGURATION (for trip-uploads)
insert into storage.buckets (id, name, public)
values ('trip-uploads', 'trip-uploads', false)
on conflict (id) do nothing;
