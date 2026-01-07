import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { db, RecurringTransaction } from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import { useAuth } from "./useAuth";

import { useTranslation } from "react-i18next";
import { processRecurringTransactions } from "../lib/recurring";
import {
  getRecurringTransactionInputSchema,
  getRecurringTransactionUpdateSchema,
  validate,
} from "../lib/validation";

export function useRecurringTransactions(groupId?: string | null) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const recurringTransactions = useLiveQuery(() =>
    db.recurring_transactions.toArray()
  );

  // Filter out deleted items and optionally by group
  const activeRecurring =
    recurringTransactions?.filter((r) => {
      if (r.deleted_at) return false;

      if (groupId === undefined) {
        // Return all recurring transactions (no group filter)
        return true;
      } else if (groupId === null) {
        // Return only personal recurring transactions
        return !r.group_id;
      } else {
        // Return only recurring transactions for specific group
        return r.group_id === groupId;
      }
    }) || [];

  const addRecurringTransaction = async (
    transaction: Omit<
      RecurringTransaction,
      "id" | "sync_token" | "deleted_at" | "active" | "last_generated"
    >
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate input data
    const validatedData = validate(getRecurringTransactionInputSchema(t), {
      ...transaction,
      active: 1,
    });

    const id = uuidv4();
    const transactionData = {
      ...validatedData,
      id,
      deleted_at: null,
      last_generated: undefined,
    };

    // Immediate write to Supabase (queues if offline)
    await insertRecord("recurring_transactions", transactionData, user.id);
  };

  const updateRecurringTransaction = async (
    id: string,
    updates: Partial<Omit<RecurringTransaction, "id" | "sync_token">>
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate update data
    const validatedUpdates = validate(
      getRecurringTransactionUpdateSchema(t),
      updates
    );

    // Immediate write to Supabase (queues if offline)
    await updateRecord("recurring_transactions", id, validatedUpdates, user.id);
  };

  const deleteRecurringTransaction = async (id: string) => {
    // Immediate soft delete in Supabase (queues if offline)
    await deleteRecord("recurring_transactions", id);
  };

  const generateTransactions = async () => {
    return await processRecurringTransactions();
  };

  return {
    recurringTransactions: activeRecurring,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    generateTransactions,
  };
}
