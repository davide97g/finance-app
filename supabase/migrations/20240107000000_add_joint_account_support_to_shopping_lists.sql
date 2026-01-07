-- ============================================================================
-- ADD JOINT ACCOUNT SUPPORT TO SHOPPING LISTS
-- ============================================================================
-- This migration adds support for joint account partners to automatically
-- share shopping collections bidirectionally with real-time updates.
-- ============================================================================

-- Update helper function to include joint account partners
-- Returns true if user is a member OR the creator OR joint account partner of creator
create or replace function is_collection_member(collection_id uuid)
returns boolean as $$
begin
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

-- Update RLS policies to allow joint account partners to manage members
drop policy if exists "Only creator can add members" on public.shopping_collection_members;
create policy "Creator and joint account partner can add members"
  on public.shopping_collection_members for insert
  with check (
    is_collection_creator(collection_id) 
    or is_collection_member(collection_id)
  );

drop policy if exists "Only creator can update members" on public.shopping_collection_members;
create policy "Creator and joint account partner can update members"
  on public.shopping_collection_members for update
  using (
    is_collection_creator(collection_id) 
    or is_collection_member(collection_id)
  );

drop policy if exists "Only creator can remove members" on public.shopping_collection_members;
create policy "Creator and joint account partner can remove members"
  on public.shopping_collection_members for delete
  using (
    is_collection_creator(collection_id) 
    or is_collection_member(collection_id)
  );

