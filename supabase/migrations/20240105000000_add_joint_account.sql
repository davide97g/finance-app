-- Add joint_account_partner_id column to user_settings table
alter table public.user_settings
  add column joint_account_partner_id uuid references auth.users(id);

-- Add constraint to prevent self-linking
alter table public.user_settings
  add constraint check_no_self_link 
  check (joint_account_partner_id is null or joint_account_partner_id != user_id);

-- Add index for efficient partner lookups
create index idx_user_settings_joint_account_partner 
  on public.user_settings(joint_account_partner_id) 
  where joint_account_partner_id is not null;

-- Helper function to check if two users are joint account partners
-- Returns true if current user has partner_id set OR if partner_id has current user set (bidirectional check)
create or replace function is_joint_account_partner(partner_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_settings
    where user_id = auth.uid() and joint_account_partner_id = partner_id
  ) or exists (
    select 1 from public.user_settings
    where user_id = partner_id and joint_account_partner_id = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Update RLS policies for transactions to allow joint account partners
drop policy if exists "Users can view their own or group transactions" on public.transactions;
create policy "Users can view their own or group transactions"
  on public.transactions for select
  using (
    (group_id is null and (
      (select auth.uid()) = user_id
      or is_joint_account_partner(user_id)
    ))
    or (group_id is not null and is_group_member(group_id))
  );

-- Update RLS policies for categories to allow joint account partners
drop policy if exists "Users can view their own personal categories" on public.categories;
create policy "Users can view their own personal categories"
  on public.categories for select
  using (
    (group_id is null and (
      (select auth.uid()) = user_id
      or is_joint_account_partner(user_id)
    ))
    or (group_id is not null and is_group_member(group_id))
  );

drop policy if exists "Users can update their own or group categories" on public.categories;
create policy "Users can update their own or group categories"
  on public.categories for update
  using (
    (group_id is null and (
      (select auth.uid()) = user_id
      or is_joint_account_partner(user_id)
    ))
    or (group_id is not null and is_group_member(group_id))
  );

-- Update RLS policies for contexts to allow joint account partners
drop policy if exists "Users can view their own contexts" on public.contexts;
create policy "Users can view their own contexts"
  on public.contexts for select
  using (
    (select auth.uid()) = user_id
    or is_joint_account_partner(user_id)
  );

drop policy if exists "Users can update their own contexts" on public.contexts;
create policy "Users can update their own contexts"
  on public.contexts for update
  using (
    (select auth.uid()) = user_id
    or is_joint_account_partner(user_id)
  );

-- Update RLS policies for recurring_transactions to allow joint account partners
drop policy if exists "Users can view their own or group recurring transactions" on public.recurring_transactions;
create policy "Users can view their own or group recurring transactions"
  on public.recurring_transactions for select
  using (
    (group_id is null and (
      (select auth.uid()) = user_id
      or is_joint_account_partner(user_id)
    ))
    or (group_id is not null and is_group_member(group_id))
  );

drop policy if exists "Users can update their own or group recurring transactions" on public.recurring_transactions;
create policy "Users can update their own or group recurring transactions"
  on public.recurring_transactions for update
  using (
    (group_id is null and (
      (select auth.uid()) = user_id
      or is_joint_account_partner(user_id)
    ))
    or (group_id is not null and is_group_member(group_id))
  );

-- Update RLS policies for category_budgets to allow joint account partners
drop policy if exists "Users can view their own category budgets" on public.category_budgets;
create policy "Users can view their own category budgets"
  on public.category_budgets for select
  using (
    (select auth.uid()) = user_id
    or is_joint_account_partner(user_id)
  );

drop policy if exists "Users can update their own category budgets" on public.category_budgets;
create policy "Users can update their own category budgets"
  on public.category_budgets for update
  using (
    (select auth.uid()) = user_id
    or is_joint_account_partner(user_id)
  );

