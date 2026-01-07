/**
 * @fileoverview Simple data pull from Supabase for initial app load.
 *
 * Pulls all data from Supabase once on app start, then relies on
 * realtime subscriptions for updates.
 *
 * @module lib/dataPull
 */

import { db } from "./db";
import { supabase } from "./supabase";

const TABLES = [
  "profiles",
  "groups",
  "group_members",
  "contexts",
  "categories",
  "transactions",
  "recurring_transactions",
  "category_budgets",
  "category_usage_stats",
  "shopping_collections",
  "shopping_collection_members",
  "shopping_lists",
  "shopping_items",
  "shopping_list_items",
] as const;

const SUPABASE_LIMIT = 1000;

/**
 * Prepare item for local storage
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
 * Pull all data from Supabase for initial load
 */
export async function pullAllData(userId: string): Promise<void> {
  console.log("[DataPull] Starting initial data pull...");

  for (const tableName of TABLES) {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .order("updated_at", { ascending: true })
          .range(page * SUPABASE_LIMIT, (page + 1) * SUPABASE_LIMIT - 1);

        if (error) {
          console.error(`[DataPull] Failed to pull ${tableName}:`, error);
          hasMore = false;
          continue;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          continue;
        }

        console.log(`[DataPull] Pulled ${data.length} items from ${tableName}`);

        // Store in IndexedDB
        await db.transaction("rw", db.table(tableName), async () => {
          for (const item of data) {
            const localItem = prepareForLocal(
              item as Record<string, unknown>,
              tableName
            );
            await db.table(tableName).put(localItem as never);
          }
        });

        // Check if we need to fetch more pages
        if (data.length < SUPABASE_LIMIT) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (error) {
        console.error(`[DataPull] Error pulling ${tableName}:`, error);
        hasMore = false;
      }
    }
  }

  // Pull user settings separately
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[DataPull] Failed to pull user_settings:", error);
    } else if (data) {
      // Map Supabase column names to local field names
      const localItem = {
        user_id: data.user_id,
        currency: data.currency || "EUR",
        language: data.language || "en",
        theme: (data.theme as "light" | "dark" | "system") || "light",
        accentColor: data.accent_color || "slate",
        start_of_week: (data.start_of_week as "monday" | "sunday") || "monday",
        default_view: (data.default_view as "list" | "calendar") || "list",
        include_investments_in_expense_totals:
          data.include_investments_in_expense_totals || false,
        include_group_expenses: data.include_group_expenses || false,
        monthly_budget: data.monthly_budget,
        cached_month: data.cached_month || undefined,
        category_sorting_enabled: data.category_sorting_enabled ?? false,
        category_sorting_strategy: data.category_sorting_strategy as
          | "moving_average"
          | "total_all_time"
          | "recent_order"
          | null
          | undefined,
        category_sorting_days: data.category_sorting_days ?? 30,
        user_mode:
          (data.user_mode as "default" | "simplified" | "advanced") ||
          "default",
        revolut_username: data.revolut_username || null,
        joint_account_partner_id: data.joint_account_partner_id || null,
        updated_at: data.updated_at || undefined,
      };

      await db.user_settings.put(localItem);
      console.log("[DataPull] Pulled user_settings");
    }
  } catch (error) {
    console.error("[DataPull] Error pulling user_settings:", error);
  }

  console.log("[DataPull] Initial data pull completed");
}
