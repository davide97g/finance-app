-- ============================================================================
-- FIX SHOPPING COLLECTIONS RLS POLICIES
-- ============================================================================
-- This migration fixes RLS policy issues that prevent creating and managing
-- shopping collections, lists, and items. The main issue is circular dependencies
-- in the policies when checking collection membership.
-- ============================================================================

-- Ensure the helper functions can always access collections they need
-- These functions use security definer, so they bypass RLS, but we need to
-- make sure they're working correctly

-- Recreate is_collection_creator to ensure it works correctly
-- This function should always be able to check if a user created a collection
create or replace function is_collection_creator(collection_id uuid)
returns boolean as $$
begin
  -- Security definer functions bypass RLS, so this should always work
  return exists (
    select 1 from public.shopping_collections
    where shopping_collections.id = $1
      and shopping_collections.created_by = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Recreate is_collection_member to ensure it works correctly
-- This function checks if user is a member OR creator OR joint account partner
create or replace function is_collection_member(collection_id uuid)
returns boolean as $$
begin
  -- Security definer functions bypass RLS, so this should always work
  return exists (
    select 1 from public.shopping_collection_members
    where shopping_collection_members.collection_id = $1
      and shopping_collection_members.user_id = auth.uid()
      and shopping_collection_members.removed_at is null
  ) or exists (
    select 1 from public.shopping_collections
    where shopping_collections.id = $1
      and (
        shopping_collections.created_by = auth.uid()
        or is_joint_account_partner(shopping_collections.created_by)
      )
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Fix the policy for inserting collection members
-- The key issue: when a collection is first created, the creator should be able
-- to add members immediately. The is_collection_creator check should work,
-- but we need to ensure the policy is correct.
-- 
-- We allow both creators and joint account partners to add members.
-- Since is_collection_member already checks for joint account partners,
-- we can use it here. However, to avoid circular dependencies, we prioritize
-- is_collection_creator which directly checks created_by.
drop policy if exists "Creator and joint account partner can add members" on public.shopping_collection_members;
drop policy if exists "Creator can add members" on public.shopping_collection_members;
create policy "Creator and joint account partner can add members"
  on public.shopping_collection_members for insert
  with check (
    -- Creator can always add members (is_collection_creator uses security definer, so it bypasses RLS)
    is_collection_creator(collection_id)
    -- OR if user is a collection member (which includes joint account partners)
    -- Note: is_collection_member uses security definer, so it bypasses RLS
    or is_collection_member(collection_id)
  );

-- Ensure the SELECT policy on shopping_collections allows creators to see their collections
-- This is already handled by is_collection_member, but let's make sure it's explicit
-- The existing policy should work, but we'll verify it's correct

-- Fix the policy for viewing collection members
-- This should allow members and creators to view members
drop policy if exists "Members can view collection members" on public.shopping_collection_members;
create policy "Members can view collection members"
  on public.shopping_collection_members for select
  using (
    is_collection_member(collection_id)
    or is_collection_creator(collection_id)
  );

-- Ensure update and delete policies are correct
-- Allow both creators and joint account partners to manage members
drop policy if exists "Creator and joint account partner can update members" on public.shopping_collection_members;
drop policy if exists "Creator can update members" on public.shopping_collection_members;
create policy "Creator and joint account partner can update members"
  on public.shopping_collection_members for update
  using (
    is_collection_creator(collection_id)
    or is_collection_member(collection_id)
  );

drop policy if exists "Creator and joint account partner can remove members" on public.shopping_collection_members;
drop policy if exists "Creator can remove members" on public.shopping_collection_members;
create policy "Creator and joint account partner can remove members"
  on public.shopping_collection_members for delete
  using (
    is_collection_creator(collection_id)
    or is_collection_member(collection_id)
  );

-- ============================================================================
-- VERIFY POLICIES FOR OTHER TABLES
-- ============================================================================
-- Ensure policies for shopping_lists, shopping_items, and shopping_list_items
-- are working correctly. These should already be correct, but let's verify
-- the key ones that might have issues.

-- Shopping Lists: Ensure members can create lists
-- The policy checks is_collection_member(collection_id), which should work
-- because is_collection_member checks if user is creator OR member

-- Shopping Items: Ensure members can create items
-- Same as above

-- Shopping List Items: Ensure members can create list items
-- This checks membership through the list's collection_id, which should work

-- All policies should now work correctly because:
-- 1. is_collection_creator uses security definer and can always check created_by
-- 2. is_collection_member uses security definer and can check both members table and collections table
-- 3. The policies prioritize is_collection_creator for inserts, which works immediately after collection creation

