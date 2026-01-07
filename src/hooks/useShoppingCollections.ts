import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import {
  db,
  Profile,
  ShoppingCollection,
  ShoppingCollectionMember,
} from "../lib/db";
import { syncManager } from "../lib/sync";
import { useAuth } from "./useAuth";

/**
 * Extended collection type with member information.
 */
export interface ShoppingCollectionWithMembers extends ShoppingCollection {
  /** List of active members in the collection */
  members: (ShoppingCollectionMember & {
    profile?: Profile;
    displayName: string;
  })[];
  /** Whether the current user created this collection */
  isCreator: boolean;
}

/**
 * Hook for managing shopping collections with member management.
 *
 * Collections can be private (only creator) or shared with multiple users.
 * All members have write access to lists and items within the collection.
 *
 * @returns Object containing:
 *   - `collections`: Array of collections where user is member/creator
 *   - `addCollection`: Create a new collection
 *   - `updateCollection`: Update collection name
 *   - `deleteCollection`: Soft-delete collection
 *   - `addCollectionMember`: Share collection with a user
 *   - `removeCollectionMember`: Remove a member from the collection
 */
export function useShoppingCollections() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Get all collections where user is a member or creator
  const collections = useLiveQuery(async () => {
    if (!user) return [];

    const allCollections = await db.shopping_collections.toArray();
    const allMembers = await db.shopping_collection_members.toArray();
    const allProfiles = await db.profiles.toArray();
    const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

    // Filter collections where user is creator or active member
    const userCollections = allCollections.filter((c) => {
      if (c.deleted_at) return false;
      if (c.created_by === user.id) return true;
      return allMembers.some(
        (m) =>
          m.collection_id === c.id && m.user_id === user.id && !m.removed_at
      );
    });

    // Enrich with members info
    return userCollections.map((c) => {
      const collectionMembers = allMembers
        .filter((m) => m.collection_id === c.id && !m.removed_at)
        .map((m) => {
          const profile = m.user_id ? profileMap.get(m.user_id) : undefined;
          // Determine display name: Profile name > Email > "User ..."
          let displayName = "Unknown User";
          if (profile?.full_name) displayName = profile.full_name;
          else if (profile?.email) displayName = profile.email.split("@")[0];
          else if (m.user_id === user.id) displayName = "You";
          else if (m.user_id) displayName = `User ${m.user_id.slice(0, 4)}`;

          return {
            ...m,
            profile,
            displayName,
          };
        });

      return {
        ...c,
        members: collectionMembers,
        isCreator: c.created_by === user.id,
      } as ShoppingCollectionWithMembers;
    });
  }, [user]);

  const addCollection = async (name: string, isShared: boolean = false) => {
    if (!user) return null;

    if (!name || name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    const collectionId = uuidv4();

    // Create collection
    await db.shopping_collections.add({
      id: collectionId,
      name: name.trim(),
      created_by: user.id,
      deleted_at: null,
      pendingSync: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // If shared, add creator as first member (for consistency)
    // For private collections, we don't need a member record
    if (isShared) {
      const memberId = uuidv4();
      await db.shopping_collection_members.add({
        id: memberId,
        collection_id: collectionId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
        removed_at: null,
        pendingSync: 1,
        updated_at: new Date().toISOString(),
      });
    }

    syncManager.schedulePush();
    return collectionId;
  };

  const updateCollection = async (
    id: string,
    updates: Partial<Pick<ShoppingCollection, "name">>
  ) => {
    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    await db.shopping_collections.update(id, {
      ...updates,
      name: updates.name?.trim(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });
    syncManager.schedulePush();
  };

  const deleteCollection = async (id: string) => {
    // Soft delete collection
    await db.shopping_collections.update(id, {
      deleted_at: new Date().toISOString(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });

    // Soft delete all lists in collection
    const collectionLists = await db.shopping_lists
      .filter((l) => l.collection_id === id)
      .toArray();

    for (const list of collectionLists) {
      await db.shopping_lists.update(list.id, {
        deleted_at: new Date().toISOString(),
        pendingSync: 1,
      });
    }

    // Soft delete all items in collection
    const collectionItems = await db.shopping_items
      .filter((i) => i.collection_id === id)
      .toArray();

    for (const item of collectionItems) {
      await db.shopping_items.update(item.id, {
        deleted_at: new Date().toISOString(),
        pendingSync: 1,
      });
    }

    syncManager.schedulePush();
  };

  const addCollectionMember = async (collectionId: string, userId: string) => {
    if (!userId) throw new Error("User ID is required");

    // Check if member already exists
    const existing = await db.shopping_collection_members
      .filter(
        (m) =>
          m.collection_id === collectionId &&
          m.user_id === userId &&
          !m.removed_at
      )
      .first();

    if (existing) {
      throw new Error(
        t("error.user_already_member") || "User is already a member"
      );
    }

    const memberId = uuidv4();

    await db.shopping_collection_members.add({
      id: memberId,
      collection_id: collectionId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      removed_at: null,
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });

    syncManager.schedulePush();
    return memberId;
  };

  const removeCollectionMember = async (memberId: string) => {
    await db.shopping_collection_members.update(memberId, {
      removed_at: new Date().toISOString(),
      pendingSync: 1,
      updated_at: new Date().toISOString(),
    });
    syncManager.schedulePush();
  };

  return {
    collections: collections || [],
    addCollection,
    updateCollection,
    deleteCollection,
    addCollectionMember,
    removeCollectionMember,
  };
}
