-- ============================================================================
-- SHOPPING LISTS FEATURE
-- ============================================================================

-- 1. Shopping Collections Table
create table public.shopping_collections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id) not null,
  deleted_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.shopping_collections enable row level security;

-- 2. Shopping Collection Members Table
create table public.shopping_collection_members (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references public.shopping_collections(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  joined_at timestamptz default now(),
  removed_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  unique(collection_id, user_id)
);

alter table public.shopping_collection_members enable row level security;

-- 3. Shopping Lists Table
create table public.shopping_lists (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references public.shopping_collections(id) on delete cascade not null,
  name text not null,
  created_by uuid references auth.users(id) not null,
  deleted_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.shopping_lists enable row level security;

-- 4. Shopping Items Table (reusable items pool scoped to collection)
create table public.shopping_items (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references public.shopping_collections(id) on delete cascade not null,
  name text not null,
  created_by uuid references auth.users(id) not null,
  deleted_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Partial unique index: one item name per collection (when not deleted)
create unique index shopping_items_collection_name_unique
  on public.shopping_items(collection_id, name)
  where deleted_at is null;

alter table public.shopping_items enable row level security;

-- 5. Shopping List Items Table (junction table)
create table public.shopping_list_items (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  item_id uuid references public.shopping_items(id) on delete cascade not null,
  checked boolean default false not null,
  deleted_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Partial unique index: one item per list (when not deleted)
create unique index shopping_list_items_list_item_unique
  on public.shopping_list_items(list_id, item_id)
  where deleted_at is null;

alter table public.shopping_list_items enable row level security;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Helper function: check if user is a member of the collection
-- Returns true if user is a member OR the creator of the collection
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
      and shopping_collections.created_by = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Helper function: check if user is the creator of the collection
create or replace function is_collection_creator(collection_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.shopping_collections
    where shopping_collections.id = $1
      and shopping_collections.created_by = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================================
-- RLS POLICIES - Shopping Collections
-- ============================================================================

create policy "Members can view their collections"
  on public.shopping_collections for select
  using (is_collection_member(id) or created_by = (select auth.uid()));

create policy "Authenticated users can create collections"
  on public.shopping_collections for insert
  with check ((select auth.uid()) = created_by);

create policy "Members can update collections"
  on public.shopping_collections for update
  using (is_collection_member(id) or created_by = (select auth.uid()));

create policy "Only creator can delete collection"
  on public.shopping_collections for delete
  using ((select auth.uid()) = created_by);

create trigger update_shopping_collections_sync_token
  before update on public.shopping_collections
  for each row execute procedure update_sync_token();

-- ============================================================================
-- RLS POLICIES - Shopping Collection Members
-- ============================================================================

create policy "Members can view collection members"
  on public.shopping_collection_members for select
  using (is_collection_member(collection_id) or is_collection_creator(collection_id));

create policy "Only creator can add members"
  on public.shopping_collection_members for insert
  with check (is_collection_creator(collection_id));

create policy "Only creator can update members"
  on public.shopping_collection_members for update
  using (is_collection_creator(collection_id));

create policy "Only creator can remove members"
  on public.shopping_collection_members for delete
  using (is_collection_creator(collection_id));

create trigger update_shopping_collection_members_sync_token
  before update on public.shopping_collection_members
  for each row execute procedure update_sync_token();

-- ============================================================================
-- RLS POLICIES - Shopping Lists
-- ============================================================================

create policy "Collection members can view lists"
  on public.shopping_lists for select
  using (is_collection_member(collection_id));

create policy "Collection members can create lists"
  on public.shopping_lists for insert
  with check (is_collection_member(collection_id) and (select auth.uid()) = created_by);

create policy "Collection members can update lists"
  on public.shopping_lists for update
  using (is_collection_member(collection_id));

create policy "Collection members can delete lists"
  on public.shopping_lists for delete
  using (is_collection_member(collection_id));

create trigger update_shopping_lists_sync_token
  before update on public.shopping_lists
  for each row execute procedure update_sync_token();

-- ============================================================================
-- RLS POLICIES - Shopping Items
-- ============================================================================

create policy "Collection members can view items"
  on public.shopping_items for select
  using (is_collection_member(collection_id));

create policy "Collection members can create items"
  on public.shopping_items for insert
  with check (is_collection_member(collection_id) and (select auth.uid()) = created_by);

create policy "Collection members can update items"
  on public.shopping_items for update
  using (is_collection_member(collection_id));

create policy "Collection members can delete items"
  on public.shopping_items for delete
  using (is_collection_member(collection_id));

create trigger update_shopping_items_sync_token
  before update on public.shopping_items
  for each row execute procedure update_sync_token();

-- ============================================================================
-- RLS POLICIES - Shopping List Items
-- ============================================================================

create policy "Collection members can view list items"
  on public.shopping_list_items for select
  using (
    exists (
      select 1 from public.shopping_lists
      where shopping_lists.id = shopping_list_items.list_id
        and is_collection_member(shopping_lists.collection_id)
    )
  );

create policy "Collection members can create list items"
  on public.shopping_list_items for insert
  with check (
    exists (
      select 1 from public.shopping_lists
      where shopping_lists.id = shopping_list_items.list_id
        and is_collection_member(shopping_lists.collection_id)
    )
  );

create policy "Collection members can update list items"
  on public.shopping_list_items for update
  using (
    exists (
      select 1 from public.shopping_lists
      where shopping_lists.id = shopping_list_items.list_id
        and is_collection_member(shopping_lists.collection_id)
    )
  );

create policy "Collection members can delete list items"
  on public.shopping_list_items for delete
  using (
    exists (
      select 1 from public.shopping_lists
      where shopping_lists.id = shopping_list_items.list_id
        and is_collection_member(shopping_lists.collection_id)
    )
  );

create trigger update_shopping_list_items_sync_token
  before update on public.shopping_list_items
  for each row execute procedure update_sync_token();

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

alter publication supabase_realtime add table public.shopping_collections;
alter publication supabase_realtime add table public.shopping_collection_members;
alter publication supabase_realtime add table public.shopping_lists;
alter publication supabase_realtime add table public.shopping_items;
alter publication supabase_realtime add table public.shopping_list_items;

