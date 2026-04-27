-- Add is_planted column to plants table to distinguish inventory vs planted plants.
-- Run this in the Supabase SQL editor.

alter table plants
  add column if not exists is_planted boolean not null default false;

-- Ensure date_planted can be null (unplanted plants don't have a planted date)
alter table plants
  alter column date_planted drop not null;
