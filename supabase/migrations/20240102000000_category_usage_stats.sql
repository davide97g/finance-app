-- Migration: Category Usage Statistics and Settings
-- Adds category usage tracking and sorting preferences

-- ============================================================================
-- USER SETTINGS EXTENSIONS
-- ============================================================================

-- Add new columns to user_settings for category sorting preferences
alter table public.user_settings
  add column if not exists category_sorting_enabled boolean default false,
  add column if not exists category_sorting_strategy text check (category_sorting_strategy in ('moving_average', 'total_all_time', 'recent_order')),
  add column if not exists category_sorting_days integer default 30,
  add column if not exists user_mode text check (user_mode in ('default', 'simplified', 'advanced')) default 'default';

-- ============================================================================
-- CATEGORY USAGE STATISTICS TABLE
-- ============================================================================

-- Create table to track category usage statistics
create table if not exists public.category_usage_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  transaction_count bigint default 0,
  last_used_at timestamptz,
  moving_average_30d bigint default 0,
  moving_average_7d bigint default 0,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(user_id, category_id)
);

alter table public.category_usage_stats enable row level security;

-- RLS Policies for category_usage_stats
create policy "Users can view their own category usage stats"
  on public.category_usage_stats for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own category usage stats"
  on public.category_usage_stats for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own category usage stats"
  on public.category_usage_stats for update
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

create index if not exists idx_category_usage_stats_user_id on public.category_usage_stats(user_id);
create index if not exists idx_category_usage_stats_category_id on public.category_usage_stats(category_id);
create index if not exists idx_category_usage_stats_last_used_at on public.category_usage_stats(last_used_at desc);
create index if not exists idx_category_usage_stats_user_category on public.category_usage_stats(user_id, category_id);

-- ============================================================================
-- FUNCTIONS FOR UPDATING STATISTICS
-- ============================================================================

-- Function to update category usage statistics when a transaction is created/updated
create or replace function update_category_usage_stats()
returns trigger as $$
declare
  category_type text;
  transaction_user_id uuid;
begin
  -- Only process expense transactions
  if new.type != 'expense' then
    return new;
  end if;

  -- Get user_id from transaction
  transaction_user_id := new.user_id;

  -- Get category type to ensure it's an expense category
  select type into category_type
  from public.categories
  where id = new.category_id;

  -- Only process expense categories
  if category_type != 'expense' then
    return new;
  end if;

  -- Update or insert statistics
  insert into public.category_usage_stats (
    user_id,
    category_id,
    transaction_count,
    last_used_at,
    moving_average_30d,
    moving_average_7d,
    sync_token,
    updated_at
  )
  values (
    transaction_user_id,
    new.category_id,
    1,
    new.date::timestamptz,
    case when new.date >= current_date - interval '30 days' then 1 else 0 end,
    case when new.date >= current_date - interval '7 days' then 1 else 0 end,
    nextval('global_sync_token_seq'),
    now()
  )
  on conflict (user_id, category_id) do update set
    transaction_count = category_usage_stats.transaction_count + 1,
    last_used_at = greatest(category_usage_stats.last_used_at, new.date::timestamptz),
    moving_average_30d = (
      select count(*)::bigint
      from public.transactions
      where user_id = transaction_user_id
        and category_id = new.category_id
        and type = 'expense'
        and deleted_at is null
        and date >= current_date - interval '30 days'
    ),
    moving_average_7d = (
      select count(*)::bigint
      from public.transactions
      where user_id = transaction_user_id
        and category_id = new.category_id
        and type = 'expense'
        and deleted_at is null
        and date >= current_date - interval '7 days'
    ),
    sync_token = nextval('global_sync_token_seq'),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Function to recalculate all statistics for a user (useful for initial setup or corrections)
create or replace function recalculate_category_usage_stats(target_user_id uuid)
returns void as $$
begin
  -- Delete existing stats for user
  delete from public.category_usage_stats
  where user_id = target_user_id;

  -- Recalculate stats from transactions
  insert into public.category_usage_stats (
    user_id,
    category_id,
    transaction_count,
    last_used_at,
    moving_average_30d,
    moving_average_7d,
    sync_token,
    updated_at
  )
  select
    t.user_id,
    t.category_id,
    count(*)::bigint as transaction_count,
    max(t.date::timestamptz) as last_used_at,
    count(*) filter (where t.date >= current_date - interval '30 days')::bigint as moving_average_30d,
    count(*) filter (where t.date >= current_date - interval '7 days')::bigint as moving_average_7d,
    nextval('global_sync_token_seq') as sync_token,
    now() as updated_at
  from public.transactions t
  inner join public.categories c on c.id = t.category_id
  where t.user_id = target_user_id
    and t.type = 'expense'
    and c.type = 'expense'
    and t.deleted_at is null
    and c.deleted_at is null
  group by t.user_id, t.category_id;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update stats on transaction insert
create trigger update_category_stats_on_insert
  after insert on public.transactions
  for each row
  when (new.type = 'expense' and new.deleted_at is null)
  execute function update_category_usage_stats();

-- Trigger to update stats on transaction update (if category changes)
create trigger update_category_stats_on_update
  after update on public.transactions
  for each row
  when (
    (old.category_id is distinct from new.category_id or old.date is distinct from new.date)
    and new.type = 'expense'
    and new.deleted_at is null
  )
  execute function update_category_usage_stats();

-- Trigger to update sync_token on category_usage_stats updates
create trigger update_category_usage_stats_sync_token
  before update on public.category_usage_stats
  for each row execute procedure update_sync_token();

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Add category_usage_stats to realtime publication
alter publication supabase_realtime add table public.category_usage_stats;

