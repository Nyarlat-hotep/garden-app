-- Add user location columns for the Discover page's location-aware filtering.
-- Run this in the Supabase SQL editor.

alter table profiles
  add column if not exists zip text,
  add column if not exists hardiness_zone text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
