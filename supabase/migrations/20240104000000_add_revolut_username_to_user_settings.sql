-- Add revolut_username column to user_settings table
alter table public.user_settings
  add column revolut_username text;

