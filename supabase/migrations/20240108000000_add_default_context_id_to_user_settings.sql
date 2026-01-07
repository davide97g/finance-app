-- Add default_context_id column to user_settings table
alter table public.user_settings
  add column default_context_id uuid references public.contexts(id);

