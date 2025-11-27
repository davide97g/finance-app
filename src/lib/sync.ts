import { db } from "./db";
import { supabase } from "./supabase";

const TABLES = [
  "groups",
  "group_members",
  "transactions",
  "categories",
  "contexts",
  "recurring_transactions",
  "category_budgets",
] as const;

export class SyncManager {
  private isSyncing = false;
  private syncListeners: Set<(syncing: boolean) => void> = new Set();

  /**
   * Main sync function - pushes local changes then pulls remote changes.
   * With Realtime enabled, this is mainly needed for:
   * 1. Initial data load after login
   * 2. Pushing offline changes when coming back online
   * 3. Manual sync trigger
   */
  async sync(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.notifyListeners(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("[Sync] Starting sync...");
      await this.pushPending(user.id);
      await this.pullDelta(user.id);
      console.log("[Sync] Sync completed");
    } catch (error) {
      console.error("[Sync] Sync failed:", error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners(false);
    }
  }

  /**
   * Push only - for when Realtime handles pulls
   */
  async pushOnly(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("[Sync] Pushing pending changes...");
      await this.pushPending(user.id);
      console.log("[Sync] Push completed");
    } catch (error) {
      console.error("[Sync] Push failed:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncChange(callback: (syncing: boolean) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifyListeners(syncing: boolean): void {
    this.syncListeners.forEach((cb) => cb(syncing));
  }

  /**
   * Push all pending local changes to Supabase
   */
  private async pushPending(userId: string): Promise<void> {
    for (const tableName of TABLES) {
      const table = db.table(tableName);
      const pendingItems = await table.where("pendingSync").equals(1).toArray();

      if (pendingItems.length === 0) continue;

      console.log(
        `[Sync] Pushing ${pendingItems.length} items to ${tableName}`
      );

      const itemsToPush = pendingItems.map((item) => {
        const { pendingSync, year_month, ...rest } = item; // Remove local-only fields

        // For groups, use created_by. For others, ensure user_id
        const pushItem = {
          ...rest,
          updated_at: new Date().toISOString(),
        };

        // Add user_id only if the table uses it (not groups)
        if (tableName !== "groups" && tableName !== "group_members") {
          pushItem.user_id = userId;
        }

        return pushItem;
      });

      const { error } = await supabase.from(tableName).upsert(itemsToPush);

      if (error) {
        console.error(`[Sync] Failed to push ${tableName}:`, error);
        continue;
      }

      // Mark as synced locally
      await db.transaction("rw", table, async () => {
        for (const item of pendingItems) {
          await table.update(item.id, { pendingSync: 0 });
        }
      });
    }
  }

  /**
   * Pull changes from Supabase that are newer than our last sync token.
   * With Realtime active, this is mainly for initial load.
   */
  private async pullDelta(userId: string): Promise<void> {
    const userSettings = await db.user_settings.get(userId);
    const lastSyncToken = userSettings?.last_sync_token || 0;
    let maxToken = lastSyncToken;

    for (const tableName of TABLES) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .gt("sync_token", lastSyncToken);

      if (error) {
        console.error(`[Sync] Failed to pull ${tableName}:`, error);
        continue;
      }

      if (!data || data.length === 0) continue;

      console.log(`[Sync] Pulled ${data.length} items from ${tableName}`);

      await db.transaction("rw", db.table(tableName), async () => {
        for (const item of data) {
          // Check for conflict - local pending changes
          const existing = await db.table(tableName).get(item.id);
          if (existing?.pendingSync === 1) {
            // Last-write-wins: compare timestamps
            const localTime = existing.updated_at
              ? new Date(existing.updated_at).getTime()
              : 0;
            const remoteTime = item.updated_at
              ? new Date(item.updated_at).getTime()
              : 0;

            if (localTime >= remoteTime) {
              // Local is newer, skip remote
              console.log(
                `[Sync] Skipping ${tableName} ${item.id} - local is newer`
              );
              continue;
            }
          }

          // Calculate year_month for transactions if missing
          let localItem = { ...item, pendingSync: 0 };
          if (tableName === "transactions" && item.date) {
            localItem.year_month = item.date.substring(0, 7);
          }

          await db.table(tableName).put(localItem);
          if (item.sync_token > maxToken) {
            maxToken = item.sync_token;
          }
        }
      });
    }

    if (maxToken > lastSyncToken) {
      if (userSettings) {
        await db.user_settings.update(userId, { last_sync_token: maxToken });
      } else {
        // Create settings if not exist (should exist though)
        await db.user_settings.add({
          user_id: userId,
          currency: "EUR",
          language: "en",
          theme: "light",
          accentColor: "slate",
          start_of_week: "monday",
          default_view: "list",
          include_investments_in_expense_totals: false,
          include_group_expenses: false,
          last_sync_token: maxToken,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }
}

export const syncManager = new SyncManager();
