/**
 * @fileoverview Retry queue system for offline operation queuing.
 *
 * Stores failed database operations in IndexedDB and retries them
 * automatically when the connection is restored.
 *
 * @module lib/retryQueue
 */

import Dexie, { Table } from "dexie";
import { supabase } from "./supabase";

/**
 * Queued operation for retry
 */
export interface QueuedOperation {
  /** Auto-increment ID */
  id?: number;
  /** Table name */
  table: string;
  /** Operation type */
  operation: "insert" | "update" | "delete";
  /** Record ID (for update/delete) */
  recordId: string;
  /** Data to insert/update */
  data?: Record<string, unknown>;
  /** Number of retry attempts */
  attempts: number;
  /** Timestamp when queued */
  queuedAt: string;
  /** Last error message */
  lastError?: string;
}

/**
 * Retry queue database
 */
class RetryQueueDatabase extends Dexie {
  queue!: Table<QueuedOperation>;

  constructor() {
    super("RetryQueueDB");
    this.version(1).stores({
      queue: "++id, table, recordId, queuedAt",
    });
  }
}

const retryQueueDb = new RetryQueueDatabase();

/**
 * Maximum number of retry attempts before giving up
 */
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Retry queue manager
 */
class RetryQueueManager {
  private isRetrying = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Queue an operation for retry
   */
  async queueOperation(
    table: string,
    operation: "insert" | "update" | "delete",
    recordId: string,
    data?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    await retryQueueDb.queue.add({
      table,
      operation,
      recordId,
      data,
      attempts: 0,
      queuedAt: new Date().toISOString(),
      lastError: error,
    });

    console.log(
      `[RetryQueue] Queued ${operation} operation for ${table}:${recordId}`
    );

    // Trigger retry if online
    if (navigator.onLine) {
      this.retryQueuedOperations();
    }
  }

  /**
   * Retry all queued operations
   */
  async retryQueuedOperations(): Promise<void> {
    if (this.isRetrying || !navigator.onLine) {
      return;
    }

    this.isRetrying = true;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("[RetryQueue] No user, skipping retry");
        return;
      }

      const queued = await retryQueueDb.queue.toArray();
      if (queued.length === 0) {
        return;
      }

      console.log(
        `[RetryQueue] Retrying ${queued.length} queued operations...`
      );

      for (const op of queued) {
        try {
          await this.executeOperation(op, user.id);

          // Success - remove from queue
          if (op.id) {
            await retryQueueDb.queue.delete(op.id);
            console.log(
              `[RetryQueue] Successfully retried ${op.operation} for ${op.table}:${op.recordId}`
            );
          }
        } catch (error) {
          // Increment attempts
          const attempts = op.attempts + 1;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          if (op.id) {
            if (attempts >= MAX_RETRY_ATTEMPTS) {
              // Max attempts reached - remove from queue
              console.error(
                `[RetryQueue] Max attempts reached for ${op.table}:${op.recordId}, removing from queue`
              );
              await retryQueueDb.queue.delete(op.id);
            } else {
              // Update attempts
              await retryQueueDb.queue.update(op.id, {
                attempts,
                lastError: errorMessage,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("[RetryQueue] Error during retry:", error);
    } finally {
      this.isRetrying = false;
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(
    op: QueuedOperation,
    userId: string
  ): Promise<void> {
    const { table, operation, recordId, data } = op;

    // Prepare data for Supabase
    const supabaseData = data
      ? {
          ...data,
          updated_at: new Date().toISOString(),
        }
      : undefined;

    // Add user_id if table requires it (except for tables that don't use it)
    const tablesWithoutUserId = [
      "groups",
      "group_members",
      "shopping_collections",
      "shopping_collection_members",
      "shopping_lists",
      "shopping_items",
      "shopping_list_items",
    ];

    if (
      supabaseData &&
      !tablesWithoutUserId.includes(table) &&
      table !== "user_settings"
    ) {
      (supabaseData as Record<string, unknown>).user_id = userId;
    }

    switch (operation) {
      case "insert": {
        if (!supabaseData) {
          throw new Error("Insert operation requires data");
        }
        const { error } = await supabase
          .from(table as never)
          .insert(supabaseData as never)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }
        break;
      }

      case "update": {
        if (!supabaseData) {
          throw new Error("Update operation requires data");
        }
        const { error } = await supabase
          .from(table as never)
          .update(supabaseData as never)
          .eq("id", recordId)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }
        break;
      }

      case "delete": {
        // Soft delete by setting deleted_at
        const { error } = await supabase
          .from(table as never)
          .update({ deleted_at: new Date().toISOString() } as never)
          .eq("id", recordId);

        if (error) {
          throw new Error(error.message);
        }
        break;
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Get count of queued operations
   */
  async getQueueCount(): Promise<number> {
    return retryQueueDb.queue.count();
  }

  /**
   * Clear all queued operations
   */
  async clearQueue(): Promise<void> {
    await retryQueueDb.queue.clear();
  }

  /**
   * Start automatic retry on online event
   */
  startAutoRetry(): void {
    const handleOnline = () => {
      console.log("[RetryQueue] Back online, retrying queued operations...");
      // Small delay to ensure connection is stable
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
      }
      this.retryTimer = setTimeout(() => {
        this.retryQueuedOperations();
      }, 1000);
    };

    window.addEventListener("online", handleOnline);
  }
}

export const retryQueue = new RetryQueueManager();

// Start auto-retry on online events
retryQueue.startAutoRetry();
