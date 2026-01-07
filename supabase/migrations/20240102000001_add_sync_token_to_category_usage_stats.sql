-- Migration: Add sync_token to category_usage_stats if missing
-- This handles the case where the table was created before sync_token was added

-- Add sync_token column if it doesn't exist
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'category_usage_stats'
      and column_name = 'sync_token'
  ) then
    alter table public.category_usage_stats
      add column sync_token bigint default nextval('global_sync_token_seq');
    
    -- Update existing rows to have sync_token
    update public.category_usage_stats
    set sync_token = nextval('global_sync_token_seq')
    where sync_token is null;
    
    -- Create trigger if it doesn't exist
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'update_category_usage_stats_sync_token'
    ) then
      create trigger update_category_usage_stats_sync_token
        before update on public.category_usage_stats
        for each row execute procedure update_sync_token();
    end if;
  end if;
end $$;

