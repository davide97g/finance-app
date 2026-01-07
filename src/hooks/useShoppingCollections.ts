import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import {
  db,
  Profile,
  ShoppingCollection,
  ShoppingCollectionMember,
} from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import { getJointAccountPartnerId } from "../lib/jointAccount";
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
    const allSettings = await db.user_settings.toArray();
    const settingsMap = new Map(allSettings.map((s) => [s.user_id, s]));

    // Get joint account partner ID (bidirectional check)
    const currentUserSettings = settingsMap.get(user.id);
    const jointAccountPartnerId =
      currentUserSettings?.joint_account_partner_id || null;

    // Also check if any other user has this user as their partner (bidirectional)
    const partnerUserId =
      Array.from(settingsMap.entries()).find(
        ([_, s]) => s.joint_account_partner_id === user.id
      )?.[0] || null;

    // Filter collections where user is creator, active member, or joint account partner of creator
    const userCollections = allCollections.filter((c) => {
      if (c.deleted_at) return false;
      if (c.created_by === user.id) return true;

      // Check if user is a member
      if (
        allMembers.some(
          (m) =>
            m.collection_id === c.id && m.user_id === user.id && !m.removed_at
        )
      ) {
        return true;
      }

      // Check if user is joint account partner of creator
      const creatorSettings = settingsMap.get(c.created_by);
      if (creatorSettings?.joint_account_partner_id === user.id) {
        return true;
      }

      // Check if creator is joint account partner of user (bidirectional)
      if (
        jointAccountPartnerId === c.created_by ||
        partnerUserId === c.created_by
      ) {
        return true;
      }

      return false;
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
    const collectionData = {
      id: collectionId,
      name: name.trim(),
      created_by: user.id,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await insertRecord("shopping_collections", collectionData, user.id);

    // Get joint account partner ID
    const jointAccountPartnerId = await getJointAccountPartnerId(user.id);

    // If shared OR has joint account partner, add members
    if (isShared || jointAccountPartnerId) {
      // Add creator as first member (for consistency in shared collections)
      if (isShared) {
        const memberId = uuidv4();
        const memberData = {
          id: memberId,
          collection_id: collectionId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          removed_at: null,
          updated_at: new Date().toISOString(),
        };
        await insertRecord("shopping_collection_members", memberData, user.id);
      }

      // Automatically add joint account partner as member (bidirectional sharing)
      if (jointAccountPartnerId) {
        const partnerMemberId = uuidv4();
        const partnerMemberData = {
          id: partnerMemberId,
          collection_id: collectionId,
          user_id: jointAccountPartnerId,
          joined_at: new Date().toISOString(),
          removed_at: null,
          updated_at: new Date().toISOString(),
        };
        await insertRecord(
          "shopping_collection_members",
          partnerMemberData,
          user.id
        );
      }
    }

    return collectionId;
  };

  const updateCollection = async (
    id: string,
    updates: Partial<Pick<ShoppingCollection, "name">>
  ) => {
    if (!user) throw new Error("User must be logged in");

    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error(t("validation.name_required") || "Name is required");
    }

    await updateRecord(
      "shopping_collections",
      id,
      {
        ...updates,
        name: updates.name?.trim(),
        updated_at: new Date().toISOString(),
      },
      user.id
    );
  };

  const deleteCollection = async (id: string) => {
    if (!user) throw new Error("User must be logged in");

    // Soft delete collection
    await deleteRecord("shopping_collections", id);

    // Soft delete all lists in collection
    const collectionLists = await db.shopping_lists
      .filter((l) => l.collection_id === id)
      .toArray();

    for (const list of collectionLists) {
      await deleteRecord("shopping_lists", list.id);
    }

    // Soft delete all items in collection
    const collectionItems = await db.shopping_items
      .filter((i) => i.collection_id === id)
      .toArray();

    for (const item of collectionItems) {
      await deleteRecord("shopping_items", item.id);
    }
  };

  const addCollectionMember = async (collectionId: string, userId: string) => {
    if (!user) throw new Error("User must be logged in");
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

    const memberData = {
      id: memberId,
      collection_id: collectionId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      removed_at: null,
      updated_at: new Date().toISOString(),
    };
    await insertRecord("shopping_collection_members", memberData, user.id);
    return memberId;
  };

  const removeCollectionMember = async (memberId: string) => {
    if (!user) throw new Error("User must be logged in");

    await updateRecord(
      "shopping_collection_members",
      memberId,
      {
        removed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      user.id
    );
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
