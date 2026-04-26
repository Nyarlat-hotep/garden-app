-- Extend the plants.category check constraint to allow 'flower'.
-- Run this in the Supabase SQL editor.

alter table plants drop constraint if exists plants_category_check;

alter table plants add constraint plants_category_check
  check (category in ('vegetable', 'fruit', 'herb', 'protein', 'flower'));
