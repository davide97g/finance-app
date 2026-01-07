import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthProvider";
import { Context, db } from "../lib/db";
import { deleteRecord, insertRecord, updateRecord } from "../lib/dbOperations";
import { getJointAccountPartnerId } from "../lib/jointAccount";
import {
  getContextInputSchema,
  getContextUpdateSchema,
  validate,
} from "../lib/validation";

/**
 * Hook for managing transaction contexts (e.g., "Work", "Personal", "Vacation").
 *
 * Contexts provide an additional dimension for categorizing transactions
 * beyond the category hierarchy. Useful for tracking spending by project,
 * trip, or life area.
 *
 * @returns Object containing:
 *   - `contexts`: Array of active (non-deleted) contexts
 *   - `addContext`: Create a new context
 *   - `updateContext`: Update an existing context
 *   - `deleteContext`: Soft-delete a context
 *
 * @example
 * ```tsx
 * const { contexts, addContext } = useContexts();
 *
 * // Create a new context
 * await addContext({
 *   user_id: 'user-123',
 *   name: 'Summer Vacation 2024'
 * });
 * ```
 */
export function useContexts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const contexts = useLiveQuery(async () => {
    const ctxs = await db.contexts.toArray();

    // Get joint account partner ID if configured
    if (user) {
      const partnerId = await getJointAccountPartnerId(user.id);
      const userIds = partnerId ? [user.id, partnerId] : [user.id];

      // Filter to include contexts from both users if joint account
      return ctxs.filter((c) => !c.deleted_at && userIds.includes(c.user_id));
    }

    // Fallback if no user
    return ctxs.filter((c) => !c.deleted_at);
  }, [user?.id]);

  const activeContexts = contexts || [];

  const addContext = async (
    context: Omit<Context, "id" | "sync_token" | "deleted_at" | "active"> & {
      active?: boolean;
    }
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Validate input data (schema expects boolean for active)
    const validatedData = validate(getContextInputSchema(t), {
      ...context,
      active: context.active !== undefined ? (context.active ? 1 : 0) : 1,
    });

    const { active, ...rest } = validatedData;

    const id = uuidv4();
    const contextData = {
      ...rest,
      description: rest.description === null ? undefined : rest.description,
      active: active,
      id,
      deleted_at: null,
    };

    // Immediate write to Supabase (queues if offline)
    await insertRecord("contexts", contextData, user.id);
  };

  const updateContext = async (
    id: string,
    updates: Partial<Omit<Context, "id" | "sync_token" | "active">> & {
      active?: boolean | number;
    }
  ) => {
    if (!user) throw new Error("User must be logged in");

    // Prepare updates for validation (which expects number for active)
    const updatesForValidation = { ...updates };
    if (typeof updates.active === "boolean") {
      updatesForValidation.active = updates.active ? 1 : 0;
    }

    // Validate update data
    const validatedUpdates = validate(
      getContextUpdateSchema(t),
      updatesForValidation
    );

    // Convert active boolean to number safely
    const { active, description, ...rest } = validatedUpdates;
    const finalUpdates: Partial<Context> = { ...rest };
    if (active !== undefined) {
      finalUpdates.active = active;
    }
    if (description !== undefined) {
      finalUpdates.description = description === null ? undefined : description;
    }

    // Immediate write to Supabase (queues if offline)
    await updateRecord("contexts", id, finalUpdates, user.id);
  };

  const deleteContext = async (id: string) => {
    if (!user) throw new Error("User must be logged in");

    // Find all transactions with this context
    const transactions = await db.transactions
      .where("context_id")
      .equals(id)
      .toArray();

    // Detach from transactions (set context_id to null)
    for (const tx of transactions) {
      await updateRecord("transactions", tx.id, { context_id: null }, user.id);
    }

    // Soft delete context
    await deleteRecord("contexts", id);
  };

  return {
    contexts: activeContexts,
    addContext,
    updateContext,
    deleteContext,
  };
}
