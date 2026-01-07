import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { db, ShoppingItem, ShoppingListItem, ShoppingListItemImage } from "../lib/db";
import { insertRecord, updateRecord, deleteRecord } from "../lib/dbOperations";
import { useAuth } from "./useAuth";
import {
  uploadShoppingItemImage,
  deleteShoppingItemImage,
  deleteAllShoppingItemImages,
} from "../lib/shoppingItemImages";
import { supabase } from "../lib/supabase";

// Re-export ShoppingListItemImage for convenience
export type { ShoppingListItemImage };

/**
 * Extended list item with item details.
 */
export interface ShoppingListItemWithItem extends ShoppingListItem {
  item: ShoppingItem;
}

/**
 * Hook for managing shopping items and list items.
 *
 * @param collectionId - The ID of the collection (for getting all items in collection)
 * @param listId - The ID of the list (for getting items in a specific list)
 * @returns Object containing:
 *   - `items`: Array of all items in the collection (for autocomplete)
 *   - `listItems`: Array of items in the list with checked state
 *   - `addItem`: Create item and optionally add to list
 *   - `toggleItemChecked`: Toggle checked state of a list item
 *   - `deleteItem`: Soft-delete item (removes from all lists)
 *   - `removeItemFromList`: Remove item from specific list
 */
export function useShoppingItems(
  collectionId: string | null,
  listId: string | null
) {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Get all items in the collection (for autocomplete)
  const items = useLiveQuery(async () => {
    if (!collectionId) return [];

    const allItems = await db.shopping_items
      .filter((i) => i.collection_id === collectionId && !i.deleted_at)
      .toArray();

    // Sort alphabetically
    return allItems.sort((a, b) => a.name.localeCompare(b.name));
  }, [collectionId]);

  // Get items in the specific list with checked state
  const listItems = useLiveQuery(async () => {
    if (!listId) return [];

    const allListItems = await db.shopping_list_items
      .filter((li) => li.list_id === listId && !li.deleted_at)
      .toArray();

    const allItems = await db.shopping_items.toArray();
    const itemMap = new Map(allItems.map((i) => [i.id, i]));

    // Enrich with item details
    const enriched = allListItems
      .map((li) => {
        const item = itemMap.get(li.item_id);
        if (!item || item.deleted_at) return null;
        return {
          ...li,
          item,
        } as ShoppingListItemWithItem;
      })
      .filter((li): li is ShoppingListItemWithItem => li !== null);

    // Sort: unchecked first, then alphabetically
    return enriched.sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1; // unchecked first
      }
      return a.item.name.localeCompare(b.item.name);
    });
  }, [listId]);

  const addItem = async (
    collectionId: string,
    name: string,
    listId?: string
  ) => {
    if (!user) return null;

    if (!name || name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    const trimmedName = name.trim();

    // Check if item already exists in collection
    const existingItem = await db.shopping_items
      .filter(
        (i) =>
          i.collection_id === collectionId &&
          i.name.toLowerCase() === trimmedName.toLowerCase() &&
          !i.deleted_at
      )
      .first();

    let itemId: string;

    if (existingItem) {
      itemId = existingItem.id;
    } else {
      // Create new item
      itemId = uuidv4();
      const itemData = {
        id: itemId,
        collection_id: collectionId,
        name: trimmedName,
        created_by: user.id,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await insertRecord("shopping_items", itemData, user.id);
    }

    // If listId provided, add to list
    if (listId) {
      // Check if already in list
      const existingListItem = await db.shopping_list_items
        .filter(
          (li) =>
            li.list_id === listId && li.item_id === itemId && !li.deleted_at
        )
        .first();

      if (!existingListItem) {
        const listItemId = uuidv4();
        const listItemData = {
          id: listItemId,
          list_id: listId,
          item_id: itemId,
          checked: false,
          quantity: 1,
          note: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await insertRecord("shopping_list_items", listItemData, user.id);
      }
    }

    return itemId;
  };

  const toggleItemChecked = async (listItemId: string) => {
    if (!user) throw new Error("User must be logged in");

    const listItem = await db.shopping_list_items.get(listItemId);
    if (!listItem) return;

    await updateRecord("shopping_list_items", listItemId, {
      checked: !listItem.checked,
      updated_at: new Date().toISOString(),
    }, user.id);
  };

  const deleteItem = async (itemId: string) => {
    if (!user) throw new Error("User must be logged in");

    // Soft delete item
    await deleteRecord("shopping_items", itemId);

    // Soft delete all list items referencing this item
    const listItems = await db.shopping_list_items
      .filter((li) => li.item_id === itemId)
      .toArray();

    for (const li of listItems) {
      await deleteRecord("shopping_list_items", li.id);
    }
  };

  const removeItemFromList = async (listItemId: string) => {
    if (!user) throw new Error("User must be logged in");

    // Delete all images associated with this list item
    await deleteAllShoppingItemImages(listItemId, user.id);

    // Soft delete list item (removes from list but keeps item in collection)
    await deleteRecord("shopping_list_items", listItemId);
  };

  const updateListItemDetails = async (
    listItemId: string,
    details: { quantity?: number; note?: string | null }
  ) => {
    if (!user) throw new Error("User must be logged in");

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (details.quantity !== undefined) {
      updateData.quantity = Math.max(1, details.quantity);
    }

    if (details.note !== undefined) {
      updateData.note = details.note || null;
    }

    await updateRecord("shopping_list_items", listItemId, updateData, user.id);
  };

  const uploadListItemImage = async (
    listItemId: string,
    file: File
  ): Promise<ShoppingListItemImage> => {
    if (!user) throw new Error("User must be logged in");

    const result = await uploadShoppingItemImage(listItemId, file, user.id);

    // Fetch the created image record
    const { data, error } = await supabase
      .from("shopping_list_item_images")
      .select("*")
      .eq("id", result.id)
      .single();

    if (error || !data) {
      throw new Error("Failed to fetch uploaded image record");
    }

    // Store in IndexedDB
    const imageRecord: ShoppingListItemImage = {
      id: data.id,
      list_item_id: data.list_item_id,
      storage_path: data.storage_path,
      display_order: data.display_order ?? 0,
      deleted_at: data.deleted_at,
      sync_token: data.sync_token ?? undefined,
      updated_at: data.updated_at ?? undefined,
      created_at: data.created_at ?? undefined,
    };
    await db.shopping_list_item_images.put(imageRecord);

    return imageRecord;
  };

  const deleteListItemImage = async (imageId: string) => {
    if (!user) throw new Error("User must be logged in");

    // Get image record to get storage path
    const image = await db.shopping_list_item_images.get(imageId);
    if (!image) {
      throw new Error("Image not found");
    }

    await deleteShoppingItemImage(imageId, image.storage_path);
  };

  const reorderListItemImages = async (
    _listItemId: string,
    imageIds: string[]
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Update display_order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await updateRecord(
        "shopping_list_item_images",
        imageIds[i],
        {
          display_order: i,
          updated_at: new Date().toISOString(),
        },
        user.id
      );
    }
  };

  return {
    items: items || [],
    listItems: listItems || [],
    addItem,
    toggleItemChecked,
    deleteItem,
    removeItemFromList,
    updateListItemDetails,
    uploadListItemImage,
    deleteListItemImage,
    reorderListItemImages,
  };
}
