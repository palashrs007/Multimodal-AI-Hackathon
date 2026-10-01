-- Migration 003: Text-First Planning, Manual Destination & Upgraded Vision
-- Adds manual destination, destination_source, and origin_city to trips.

alter table public.trips add column if not exists destination text check (char_length(destination) <= 120);
alter table public.trips add column if not exists destination_source text
  check (destination_source in ('user', 'note', 'screenshot', 'inferred'));
alter table public.trips add column if not exists origin_city text check (char_length(origin_city) <= 120);

-- Existing destination_hint data is preserved by copying it:
update public.trips set destination = destination_hint, destination_source = 'user'
where destination is null and destination_hint is not null;

-- Text note is now mandatory for NEW trips (kept nullable at DB level so old records remain valid):
alter table public.trips drop constraint if exists trips_note_len_chk;
alter table public.trips add constraint trips_note_len_chk
  check (note_text is null or char_length(note_text) between 10 and 2000) not valid;
