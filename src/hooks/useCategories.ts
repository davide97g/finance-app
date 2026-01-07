import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthProvider";
import { UNCATEGORIZED_CATEGORY } from "../lib/constants";
import { Category, db } from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import { getJointAccountPartnerId } from "../lib/jointAccount";
import {
  getCategoryInputSchema,
  getCategoryUpdateSchema,
  validate,
} from "../lib/validation";

/**
 * Hook for managing expense/income categories with hierarchical support.
 *
 * Categories support parent-child relationships for nested organization.
 * All operations are validated with Zod and trigger sync with the server.
 *
 * @param groupId - Filter categories by group:
 *   - `undefined`: Return all categories (no filter)
 *   - `null`: Return only personal categories (no group_id)
 *   - `string`: Return categories for specific group + personal categories
 *
 * @returns Object containing:
 *   - `categories`: Filtered array of active categories
 *   - `addCategory`: Create a new category
 *   - `updateCategory`: Update an existing category
 *   - `deleteCategory`: Soft-delete a category
 *   - `reparentChildren`: Move child categories to a new parent
 *
 * @example
 * ```tsx
 * const { categories, addCategory } = useCategories();
 *
 * // Create a new category
 * await addCategory({
 *   user_id: 'user-123',
 *   name: 'Groceries',
 *   type: 'expense',
 *   color: '#22c55e',
 *   icon: 'shopping-cart'
 * });
 * ```
 */
export function useCategories(groupId?: string | null) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const categories = useLiveQuery(async () => {
    const cats = await db.categories.toArray();

    // Get joint account partner ID if configured
    if (user) {
      const partnerId = await getJointAccountPartnerId(user.id);
      const userIds = partnerId ? [user.id, partnerId] : [user.id];

      // Filter out deleted items, the local-only placeholder, and optionally by group
      return cats.filter((c) => {
        if (c.deleted_at) return false;

        // Exclude local-only "Uncategorized" placeholder category
        if (c.id === UNCATEGORIZED_CATEGORY.ID) return false;

        if (groupId === undefined) {
          // Return all categories (no group_id filter)
          // For personal categories, include both users' categories if joint account
          return c.group_id !== null || userIds.includes(c.user_id);
        } else if (groupId === null) {
          // Return only personal categories (from current user or partner if joint account)
          return !c.group_id && userIds.includes(c.user_id);
        } else {
          // Return only categories for specific group (no personal)
          return c.group_id === groupId;
        }
      });
    }

    // Fallback if no user
    return cats.filter((c) => {
      if (c.deleted_at) return false;
      if (c.id === UNCATEGORIZED_CATEGORY.ID) return false;
      if (groupId === undefined) return true;
      if (groupId === null) return !c.group_id;
      return c.group_id === groupId;
    });
  }, [groupId, user?.id]);

  const filteredCategories = categories || [];

  const addCategory = async (
    category: Omit<Category, "id" | "sync_token" | "deleted_at">
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate input data
    const validatedData = validate(getCategoryInputSchema(t), {
      ...category,
      active: category.active ?? 1,
    });

    const id = uuidv4();
    const categoryData = {
      ...validatedData,
      id,
      deleted_at: null,
    };

    // Immediate write to Supabase (queues if offline)
    await insertRecord("categories", categoryData, user.id);
    return id;
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Omit<Category, "id" | "sync_token">>
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate update data
    const validatedUpdates = validate(getCategoryUpdateSchema(t), updates);

    // Immediate write to Supabase (queues if offline)
    await updateRecord("categories", id, validatedUpdates, user.id);
  };

  const deleteCategory = async (id: string) => {
    // Immediate soft delete in Supabase (queues if offline)
    await deleteRecord("categories", id);
  };

  const reparentChildren = async (
    oldParentId: string,
    newParentId: string | undefined
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Find all children of the old parent
    const children = await db.categories
      .filter((c) => c.parent_id === oldParentId)
      .toArray();

    // Update each child immediately
    for (const child of children) {
      await updateRecord(
        "categories",
        child.id,
        { parent_id: newParentId },
        user.id
      );
    }
  };

  const migrateTransactions = async (
    oldCategoryId: string,
    newCategoryId: string
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Find all transactions with the old category
    const transactions = await db.transactions
      .where("category_id")
      .equals(oldCategoryId)
      .toArray();

    // Update each transaction immediately
    for (const tx of transactions) {
      await updateRecord(
        "transactions",
        tx.id,
        { category_id: newCategoryId },
        user.id
      );
    }

    // Also migrate recurring transactions
    const recurring = await db.recurring_transactions
      .where("category_id")
      .equals(oldCategoryId)
      .toArray();

    for (const rec of recurring) {
      await updateRecord(
        "recurring_transactions",
        rec.id,
        { category_id: newCategoryId },
        user.id
      );
    }
  };

  const deleteCategoryTransactions = async (id: string) => {
    // Find all transactions with this category
    const transactions = await db.transactions
      .where("category_id")
      .equals(id)
      .toArray();

    // Soft delete each transaction immediately
    for (const tx of transactions) {
      await deleteRecord("transactions", tx.id);
    }

    // Also delete recurring transactions
    const recurring = await db.recurring_transactions
      .where("category_id")
      .equals(id)
      .toArray();

    for (const rec of recurring) {
      await deleteRecord("recurring_transactions", rec.id);
    }
  };

  const deleteCategoryData = async (id: string) => {
    await deleteCategoryTransactions(id);
    await deleteCategory(id);
  };

  return {
    categories: filteredCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteCategoryData,
    deleteCategoryTransactions,
    reparentChildren,
    migrateTransactions,
  };
}
