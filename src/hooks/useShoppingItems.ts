import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { db, ShoppingItem, ShoppingListItem } from "../lib/db";
import { syncManager } from "../lib/sync";
import { useAuth } from "./useAuth";

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
      await db.shopping_items.add({
        id: itemId,
        collection_id: collectionId,
        name: trimmedName,
        created_by: user.id,
        deleted_at: null,
        pendingSync: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
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
        await db.shopping_list_items.add({
          id: listItemId,
          list_id: listId,
          item_id: itemId,
          checked: false,
          deleted_at: null,
          pendingSync: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    syncManager.schedulePush();
    return itemId;
  };

  const toggleItemChecked = async (listItemId: string) => {
    const listItem = await db.shopping_list_items.get(listItemId);
    if (!listItem) return;

    await db.shopping_list_items.update(listItemId, {
      checked: !listItem.checked,
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });
    syncManager.schedulePush();
  };

  const deleteItem = async (itemId: string) => {
    // Soft delete item
    await db.shopping_items.update(itemId, {
      deleted_at: new Date().toISOString(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });

    // Soft delete all list items referencing this item
    const listItems = await db.shopping_list_items
      .filter((li) => li.item_id === itemId)
      .toArray();

    for (const li of listItems) {
      await db.shopping_list_items.update(li.id, {
        deleted_at: new Date().toISOString(),
        pendingSync: 1,
      });
    }

    syncManager.schedulePush();
  };

  const removeItemFromList = async (listItemId: string) => {
    // Soft delete list item (removes from list but keeps item in collection)
    await db.shopping_list_items.update(listItemId, {
      deleted_at: new Date().toISOString(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });
    syncManager.schedulePush();
  };

  return {
    items: items || [],
    listItems: listItems || [],
    addItem,
    toggleItemChecked,
    deleteItem,
    removeItemFromList,
  };
}
