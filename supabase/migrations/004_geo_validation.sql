-- Migration 004: Geo-Validation and Activity Location Columns
-- Adds explicit city and country columns to itinerary_activities for fine-grained geo tracking.

alter table public.itinerary_activities add column if not exists city text;
alter table public.itinerary_activities add column if not exists country text;

-- Add index on activity location
create index if not exists idx_itinerary_activities_city on public.itinerary_activities (city);
create index if not exists idx_itinerary_activities_country on public.itinerary_activities (country);
