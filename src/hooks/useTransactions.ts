import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthProvider";
import { updateCategoryUsageStats } from "../lib/categoryUsage";
import { db, Transaction } from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import { getJointAccountPartnerId } from "../lib/jointAccount";
import {
  getTransactionInputSchema,
  getTransactionUpdateSchema,
  validate,
} from "../lib/validation";

/**
 * Hook for managing transactions with optional filtering.
 *
 * @param limit - Maximum number of transactions to return (optional)
 * @param yearMonth - Filter by year-month "YYYY-MM" or year "YYYY" (optional)
 * @param groupId - Filter by group: undefined = all, null = personal only, string = specific group
 */
export function useTransactions(
  limit?: number,
  yearMonth?: string,
  groupId?: string | null
) {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Single unified query that handles all filtering in one operation
  const transactions = useLiveQuery(async () => {
    if (!user) return [];

    // Get joint account partner ID if configured
    const partnerId = await getJointAccountPartnerId(user.id);
    const userIds = partnerId ? [user.id, partnerId] : [user.id];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let collection: any;

    if (yearMonth) {
      // 1. Filter by Year/Month (Most selective)
      if (yearMonth.length === 4) {
        collection = db.transactions
          .where("date")
          .between(`${yearMonth}-01-01`, `${yearMonth}-12-31\uffff`);
      } else {
        collection = db.transactions.where("year_month").equals(yearMonth);
      }
    } else if (groupId && typeof groupId === "string") {
      // 2. Filter by Group ID (if no date filter) - Uses Index!
      collection = db.transactions.where("group_id").equals(groupId);
    } else {
      // 3. No filters or Personal only (fallback to date sort)
      collection = db.transactions.orderBy("date");
    }

    // Apply remaining filters
    let results: Transaction[] = await collection.reverse().toArray();

    // Apply group filter if not already applied via index
    // (e.g. if we queried by yearMonth, or if we want personal only)
    if (groupId !== undefined) {
      if (groupId === null) {
        // Return only personal transactions (from current user or partner if joint account)
        results = results.filter(
          (tOrG) => !tOrG.group_id && userIds.includes(tOrG.user_id)
        );
      } else if (yearMonth) {
        // If we queried by yearMonth, we still need to filter by group
        results = results.filter((tOrG) => tOrG.group_id === groupId);
      }
    } else {
      // If no group filter specified (groupId === undefined), include all transactions
      // but filter personal transactions to only include joint account partners
      // Group transactions are included as-is
      results = results.filter(
        (t) => t.group_id !== null || userIds.includes(t.user_id)
      );
    }

    // Apply limit if needed (and not already applied effectively)
    if (limit && results.length > limit) {
      results = results.slice(0, limit);
    }

    // Sort by date descending (most recent first)
    // We sort here because some query paths don't guarantee order
    results.sort((a: Transaction, b: Transaction) =>
      b.date.localeCompare(a.date)
    );

    return results;
  }, [limit, yearMonth, groupId, user?.id]);

  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "sync_token" | "deleted_at">
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate input data
    const validatedData = validate(getTransactionInputSchema(t), transaction);

    const id = uuidv4();
    const transactionData = {
      ...validatedData,
      id,
      deleted_at: null,
    };

    // Immediate write to Supabase (queues if offline)
    await insertRecord("transactions", transactionData, user.id);

    // Update category usage statistics for expense transactions
    if (validatedData.type === "expense" && validatedData.category_id) {
      updateCategoryUsageStats(
        user.id,
        validatedData.category_id,
        validatedData.date
      ).catch((error) => {
        console.error(
          "[useTransactions] Failed to update category usage stats:",
          error
        );
      });
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, "id" | "sync_token">>
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Get existing transaction to check for category/date changes
    const existing = await db.transactions.get(id);

    // Validate update data (partial validation)
    const validatedUpdates = validate(getTransactionUpdateSchema(t), updates);

    // Immediate write to Supabase (queues if offline)
    await updateRecord("transactions", id, validatedUpdates, user.id);

    // Update category usage statistics if category or date changed for expense transactions
    if (existing) {
      const categoryChanged =
        validatedUpdates.category_id &&
        validatedUpdates.category_id !== existing.category_id;
      const dateChanged =
        validatedUpdates.date && validatedUpdates.date !== existing.date;
      const typeChanged =
        validatedUpdates.type && validatedUpdates.type !== existing.type;

      // If category changed, update stats for both old and new categories
      if (
        categoryChanged &&
        existing.type === "expense" &&
        existing.category_id
      ) {
        updateCategoryUsageStats(
          user.id,
          existing.category_id,
          existing.date
        ).catch((error) => {
          console.error(
            "[useTransactions] Failed to update old category usage stats:",
            error
          );
        });
      }

      // Update stats for new category if it's an expense
      const finalCategoryId =
        validatedUpdates.category_id || existing.category_id;
      const finalDate = validatedUpdates.date || existing.date;
      const finalType = validatedUpdates.type || existing.type;

      if (
        (categoryChanged || dateChanged || typeChanged) &&
        finalType === "expense" &&
        finalCategoryId
      ) {
        updateCategoryUsageStats(user.id, finalCategoryId, finalDate).catch(
          (error) => {
            console.error(
              "[useTransactions] Failed to update category usage stats:",
              error
            );
          }
        );
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    // Immediate soft delete in Supabase (queues if offline)
    await deleteRecord("transactions", id);
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
