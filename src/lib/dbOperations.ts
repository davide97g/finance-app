/**
 * @fileoverview Immediate database operations with offline queue fallback.
 *
 * All database operations attempt immediate writes to Supabase.
 * If offline or on error, operations are queued for retry.
 *
 * @module lib/dbOperations
 */

import { db } from "./db";
import { retryQueue } from "./retryQueue";
import { supabase } from "./supabase";

/**
 * Tables that don't use user_id field
 */
const TABLES_WITHOUT_USER_ID = [
  "groups",
  "group_members",
  "shopping_collections",
  "shopping_collection_members",
  "shopping_lists",
  "shopping_items",
  "shopping_list_items",
  "shopping_list_item_images",
] as const;

/**
 * Prepare item for Supabase (remove local-only fields, add user_id if needed)
 */
function prepareForSupabase<T extends string>(
  item: Record<string, unknown>,
  tableName: T,
  userId: string
): Record<string, unknown> {
  // Remove local-only fields
  const itemCopy = { ...item };
  delete itemCopy.pendingSync;
  delete itemCopy.year_month;

  // Add updated_at
  const prepared: Record<string, unknown> = {
    ...itemCopy,
    updated_at: new Date().toISOString(),
  };

  // Add user_id only if the table uses it
  if (
    !TABLES_WITHOUT_USER_ID.includes(tableName as never) &&
    tableName !== "user_settings"
  ) {
    prepared.user_id = userId;
  }

  return prepared;
}

/**
 * Prepare item for local storage (add local-only fields, normalize types)
 */
function prepareForLocal<T extends string>(
  item: Record<string, unknown>,
  tableName: T
): Record<string, unknown> {
  const local: Record<string, unknown> = {
    ...item,
  };

  // Calculate year_month for transactions
  if (tableName === "transactions" && item.date) {
    local.year_month = (item.date as string).substring(0, 7);
  }

  // Normalize boolean -> number for 'active' field
  if ("active" in local) {
    local.active = local.active ? 1 : 0;
  }

  return local;
}

/**
 * Insert a record into Supabase and IndexedDB
 */
export async function insertRecord<T extends string>(
  tableName: T,
  data: Record<string, unknown>,
  userId: string
): Promise<Record<string, unknown>> {
  // Prepare data for Supabase
  const supabaseData = prepareForSupabase(data, tableName, userId);

  try {
    // Attempt immediate write to Supabase
    const { data: result, error } = await supabase
      .from(tableName as never)
      .insert(supabaseData as never)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!result) {
      throw new Error("No data returned from insert");
    }

    // Success - update IndexedDB with server response
    const localData = prepareForLocal(
      result as Record<string, unknown>,
      tableName
    );
    await db.table(tableName).put(localData as never);

    return result as Record<string, unknown>;
  } catch (error) {
    // Queue for retry if offline or error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOffline = !navigator.onLine || errorMessage.includes("fetch");

    if (isOffline || error) {
      // Write to IndexedDB optimistically
      const localData = prepareForLocal(data, tableName);
      await db.table(tableName).put(localData as never);

      // Queue for retry
      await retryQueue.queueOperation(
        tableName,
        "insert",
        data.id as string,
        supabaseData,
        errorMessage
      );
    }

    // Re-throw if it's not an offline error (user should know)
    if (!isOffline) {
      throw error;
    }

    // Return the optimistic data
    return data;
  }
}

/**
 * Update a record in Supabase and IndexedDB
 */
export async function updateRecord<T extends string>(
  tableName: T,
  id: string,
  data: Partial<Record<string, unknown>>,
  userId: string
): Promise<Record<string, unknown>> {
  // Prepare data for Supabase
  const supabaseData = prepareForSupabase(
    data as Record<string, unknown>,
    tableName,
    userId
  );

  try {
    // Attempt immediate write to Supabase
    const { data: result, error } = await supabase
      .from(tableName as never)
      .update(supabaseData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!result) {
      throw new Error("No data returned from update");
    }

    // Success - update IndexedDB with server response
    const localData = prepareForLocal(
      result as Record<string, unknown>,
      tableName
    );
    await db.table(tableName).put(localData as never);

    return result as Record<string, unknown>;
  } catch (error) {
    // Queue for retry if offline or error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOffline = !navigator.onLine || errorMessage.includes("fetch");

    if (isOffline || error) {
      // Get existing record
      const existing = await db.table(tableName).get(id);
      if (existing) {
        // Update IndexedDB optimistically
        const localData = prepareForLocal(
          { ...existing, ...data } as Record<string, unknown>,
          tableName
        );
        await db.table(tableName).put(localData as never);

        // Queue for retry
        await retryQueue.queueOperation(
          tableName,
          "update",
          id,
          supabaseData,
          errorMessage
        );
      }
    }

    // Re-throw if it's not an offline error
    if (!isOffline) {
      throw error;
    }

    // Return the optimistic data
    const existing = await db.table(tableName).get(id);
    return (existing || data) as Record<string, unknown>;
  }
}

/**
 * Delete a record (soft delete) in Supabase and IndexedDB
 */
export async function deleteRecord<T extends string>(
  tableName: T,
  id: string
): Promise<void> {
  try {
    // Attempt immediate soft delete in Supabase
    const { error } = await supabase
      .from(tableName as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    // Success - update IndexedDB
    const existing = await db.table(tableName).get(id);
    if (existing) {
      await db.table(tableName).update(id, {
        deleted_at: new Date().toISOString(),
      } as never);
    }
  } catch (error) {
    // Queue for retry if offline or error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOffline = !navigator.onLine || errorMessage.includes("fetch");

    if (isOffline || error) {
      // Update IndexedDB optimistically
      const existing = await db.table(tableName).get(id);
      if (existing) {
        await db.table(tableName).update(id, {
          deleted_at: new Date().toISOString(),
        } as never);

        // Queue for retry
        await retryQueue.queueOperation(
          tableName,
          "delete",
          id,
          undefined,
          errorMessage
        );
      }
    }

    // Re-throw if it's not an offline error
    if (!isOffline) {
      throw error;
    }
  }
}

/**
 * Special handler for user_settings (uses user_id as primary key)
 */
export async function updateUserSettings(
  userId: string,
  data: Partial<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  // Map camelCase to snake_case for Supabase
  const supabaseData: Record<string, unknown> = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Map accentColor to accent_color
  if ("accentColor" in supabaseData) {
    supabaseData.accent_color = supabaseData.accentColor;
    delete supabaseData.accentColor;
  }

  try {
    // Attempt immediate write to Supabase
    const { data: result, error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...supabaseData } as never)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!result) {
      throw new Error("No data returned from update");
    }

    // Map snake_case back to camelCase for local storage
    const localData: Record<string, unknown> = {
      user_id: result.user_id,
      currency: result.currency || "EUR",
      language: result.language || "en",
      theme: result.theme || "light",
      accentColor: result.accent_color || "slate",
      start_of_week: result.start_of_week || "monday",
      default_view: result.default_view || "list",
      include_investments_in_expense_totals:
        result.include_investments_in_expense_totals || false,
      include_group_expenses: result.include_group_expenses || false,
      monthly_budget: result.monthly_budget,
      cached_month: result.cached_month,
      category_sorting_enabled: result.category_sorting_enabled ?? false,
      category_sorting_strategy: result.category_sorting_strategy,
      category_sorting_days: result.category_sorting_days ?? 30,
      user_mode: result.user_mode || "default",
      revolut_username: result.revolut_username,
      joint_account_partner_id: result.joint_account_partner_id,
      default_context_id: result.default_context_id,
      updated_at: result.updated_at,
    };

    // Success - update IndexedDB
    await db.user_settings.put(localData as never);

    return localData;
  } catch (error) {
    // Queue for retry if offline or error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isOffline = !navigator.onLine || errorMessage.includes("fetch");

    if (isOffline || error) {
      // Get existing settings
      const existing = await db.user_settings.get(userId);
      if (existing) {
        // Update IndexedDB optimistically
        await db.user_settings.put({
          ...existing,
          ...data,
        } as never);

        // Queue for retry
        await retryQueue.queueOperation(
          "user_settings",
          "update",
          userId,
          supabaseData,
          errorMessage
        );
      }
    }

    // Re-throw if it's not an offline error
    if (!isOffline) {
      throw error;
    }

    // Return the optimistic data
    const existing = await db.user_settings.get(userId);
    return (existing || data) as Record<string, unknown>;
  }
}
