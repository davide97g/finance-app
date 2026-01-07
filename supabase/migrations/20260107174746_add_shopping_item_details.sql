-- ============================================================================
-- ADD SHOPPING ITEM DETAILS (QUANTITY, NOTE, IMAGES)
-- ============================================================================
-- This migration adds optional details to shopping list items:
-- - quantity (default 1)
-- - note (free text)
-- - images (multiple images per item via shopping_list_item_images table)
-- Also creates storage bucket and cascade deletion for images
-- ============================================================================

-- 1. Update shopping_list_items table to add quantity and note
alter table public.shopping_list_items
  add column if not exists quantity integer default 1 not null,
  add column if not exists note text;

-- 2. Create shopping_list_item_images table
create table if not exists public.shopping_list_item_images (
  id uuid primary key default uuid_generate_v4(),
  list_item_id uuid references public.shopping_list_items(id) on delete cascade not null,
  storage_path text not null,
  display_order integer default 0 not null,
  deleted_at timestamptz,
  sync_token bigint default nextval('global_sync_token_seq'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add deleted_at column if it doesn't exist (for tables created before this column was added)
alter table public.shopping_list_item_images
  add column if not exists deleted_at timestamptz;

-- Index for efficient queries
create index if not exists shopping_list_item_images_list_item_id_idx
  on public.shopping_list_item_images(list_item_id);

-- Enable RLS
alter table public.shopping_list_item_images enable row level security;

-- 3. Create storage bucket for shopping item images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shopping-item-images',
  'shopping-item-images',
  true, -- Public read access
  2097152, -- 2MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 4. RLS Policies for shopping_list_item_images table

-- Policy: Collection members can view images
drop policy if exists "Collection members can view item images" on public.shopping_list_item_images;
create policy "Collection members can view item images"
  on public.shopping_list_item_images for select
  using (
    deleted_at is null and
    exists (
      select 1 from public.shopping_list_items sli
      inner join public.shopping_lists sl on sl.id = sli.list_id
      where sli.id = shopping_list_item_images.list_item_id
        and is_collection_member(sl.collection_id)
    )
  );

-- Policy: Collection members can create images
drop policy if exists "Collection members can create item images" on public.shopping_list_item_images;
create policy "Collection members can create item images"
  on public.shopping_list_item_images for insert
  with check (
    exists (
      select 1 from public.shopping_list_items sli
      inner join public.shopping_lists sl on sl.id = sli.list_id
      where sli.id = shopping_list_item_images.list_item_id
        and is_collection_member(sl.collection_id)
    )
  );

-- Policy: Collection members can update images
drop policy if exists "Collection members can update item images" on public.shopping_list_item_images;
create policy "Collection members can update item images"
  on public.shopping_list_item_images for update
  using (
    exists (
      select 1 from public.shopping_list_items sli
      inner join public.shopping_lists sl on sl.id = sli.list_id
      where sli.id = shopping_list_item_images.list_item_id
        and is_collection_member(sl.collection_id)
    )
  );

-- Policy: Collection members can delete images
drop policy if exists "Collection members can delete item images" on public.shopping_list_item_images;
create policy "Collection members can delete item images"
  on public.shopping_list_item_images for delete
  using (
    exists (
      select 1 from public.shopping_list_items sli
      inner join public.shopping_lists sl on sl.id = sli.list_id
      where sli.id = shopping_list_item_images.list_item_id
        and is_collection_member(sl.collection_id)
    )
  );

-- 5. RLS Policies for storage bucket

-- Policy: Collection members can upload images
-- Note: We check collection membership via the list_item_id in the path
-- Path format: {userId}/{listItemId}/{timestamp}-{filename}.webp
-- We extract listItemId from the path and verify user is a collection member
drop policy if exists "Collection members can upload item images" on storage.objects;
create policy "Collection members can upload item images"
on storage.objects for insert
with check (
  bucket_id = 'shopping-item-images' and
  (
    select count(*) > 0
    from public.shopping_list_items sli
    inner join public.shopping_lists sl on sl.id = sli.list_id
    where sli.id::text = (string_to_array(storage.objects.name, '/'))[2]
      and is_collection_member(sl.collection_id)
  )
);

-- Policy: Collection members can update images
drop policy if exists "Collection members can update item images" on storage.objects;
create policy "Collection members can update item images"
on storage.objects for update
using (
  bucket_id = 'shopping-item-images' and
  exists (
    select 1 from public.shopping_list_item_images slii
    inner join public.shopping_list_items sli on sli.id = slii.list_item_id
    inner join public.shopping_lists sl on sl.id = sli.list_id
    where slii.storage_path = storage.objects.name
      and is_collection_member(sl.collection_id)
  )
)
with check (
  bucket_id = 'shopping-item-images' and
  exists (
    select 1 from public.shopping_list_item_images slii
    inner join public.shopping_list_items sli on sli.id = slii.list_item_id
    inner join public.shopping_lists sl on sl.id = sli.list_id
    where slii.storage_path = storage.objects.name
      and is_collection_member(sl.collection_id)
  )
);

-- Policy: Collection members can delete images
drop policy if exists "Collection members can delete item images" on storage.objects;
create policy "Collection members can delete item images"
on storage.objects for delete
using (
  bucket_id = 'shopping-item-images' and
  exists (
    select 1 from public.shopping_list_item_images slii
    inner join public.shopping_list_items sli on sli.id = slii.list_item_id
    inner join public.shopping_lists sl on sl.id = sli.list_id
    where slii.storage_path = storage.objects.name
      and is_collection_member(sl.collection_id)
  )
);

-- Policy: Public read access to images (for collection members)
-- Note: For read access, we check if the image record exists and user is a collection member
drop policy if exists "Public can view item images" on storage.objects;
create policy "Public can view item images"
on storage.objects for select
using (
  bucket_id = 'shopping-item-images' and
  exists (
    select 1 from public.shopping_list_item_images slii
    inner join public.shopping_list_items sli on sli.id = slii.list_item_id
    inner join public.shopping_lists sl on sl.id = sli.list_id
    where slii.storage_path = storage.objects.name
      and is_collection_member(sl.collection_id)
  )
);

-- 6. Note: Storage file deletion is handled in application code
-- The cascade delete on shopping_list_item_images table will automatically
-- remove image records when shopping_list_items are deleted.
-- The application code will handle deleting the actual files from storage.

-- 8. Sync token trigger for shopping_list_item_images
drop trigger if exists update_shopping_list_item_images_sync_token on public.shopping_list_item_images;
create trigger update_shopping_list_item_images_sync_token
  before update on public.shopping_list_item_images
  for each row execute procedure update_sync_token();

-- 9. Enable realtime for shopping_list_item_images
-- Note: If the table is already in the publication, this will be a no-op
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'shopping_list_item_images'
      and schemaname = 'public'
  ) then
    alter publication supabase_realtime add table public.shopping_list_item_images;
  end if;
end $$;

