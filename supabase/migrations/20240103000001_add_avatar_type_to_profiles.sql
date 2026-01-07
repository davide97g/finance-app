-- Migration: Add avatar_type to profiles table
-- This field stores the user's preference for displaying avatar (initials or photo)

-- Add avatar_type column if it doesn't exist
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_type'
  ) then
    alter table public.profiles
      add column avatar_type text check (avatar_type in ('initials', 'photo')) default 'initials';
  end if;
end $$;

