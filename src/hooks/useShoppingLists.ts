import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { db, ShoppingList } from "../lib/db";
import { syncManager } from "../lib/sync";
import { useAuth } from "./useAuth";

/**
 * Hook for managing shopping lists within a collection.
 *
 * @param collectionId - The ID of the collection to get lists from
 * @returns Object containing:
 *   - `lists`: Array of lists in the collection
 *   - `addList`: Create a new list
 *   - `updateList`: Update list name
 *   - `deleteList`: Soft-delete list
 */
export function useShoppingLists(collectionId: string | null) {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Get all lists in the collection
  const lists = useLiveQuery(async () => {
    if (!user || !collectionId) return [];

    const allLists = await db.shopping_lists
      .filter((l) => l.collection_id === collectionId && !l.deleted_at)
      .toArray();

    // Sort by created_at (newest first)
    return allLists.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [user, collectionId]);

  const addList = async (collectionId: string, name: string) => {
    if (!user) return null;

    if (!name || name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    const listId = uuidv4();

    await db.shopping_lists.add({
      id: listId,
      collection_id: collectionId,
      name: name.trim(),
      created_by: user.id,
      deleted_at: null,
      pendingSync: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    syncManager.schedulePush();
    return listId;
  };

  const updateList = async (
    id: string,
    updates: Partial<Pick<ShoppingList, "name">>
  ) => {
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    await db.shopping_lists.update(id, {
      ...updates,
      name: updates.name?.trim(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });
    syncManager.schedulePush();
  };

  const deleteList = async (id: string) => {
    // Soft delete list
    await db.shopping_lists.update(id, {
      deleted_at: new Date().toISOString(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });

    // Soft delete all list items
    const listItems = await db.shopping_list_items
      .filter((li) => li.list_id === id)
      .toArray();

    for (const item of listItems) {
      await db.shopping_list_items.update(item.id, {
        deleted_at: new Date().toISOString(),
        pendingSync: 1,
      });
    }

    syncManager.schedulePush();
  };

  return {
    lists: lists || [],
    addList,
    updateList,
    deleteList,
  };
}
