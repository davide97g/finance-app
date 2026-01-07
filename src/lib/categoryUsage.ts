/**
 * @fileoverview Category usage statistics management.
 *
 * Provides functions to calculate and update category usage statistics
 * for optimizing category sorting in the UI.
 *
 * @module lib/categoryUsage
 */

import { v4 as uuidv4 } from "uuid";
import { CategoryUsageStats, db } from "./db";

/**
 * Calculate moving average for a category within a date range.
 */
const calculateMovingAverage = async (
  userId: string,
  categoryId: string,
  days: number
): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

  const count = await db.transactions
    .where("user_id")
    .equals(userId)
    .filter((tx) => {
      return (
        tx.category_id === categoryId &&
        tx.type === "expense" &&
        tx.deleted_at == null &&
        tx.date >= cutoffDateStr
      );
    })
    .count();

  return count;
};

/**
 * Update or create category usage statistics for a transaction.
 */
export const updateCategoryUsageStats = async (
  userId: string,
  categoryId: string,
  transactionDate: string
): Promise<void> => {
  // Verify category is expense type
  const category = await db.categories.get(categoryId);
  if (!category || category.type !== "expense") {
    return;
  }

  // Get existing stats or create new
  const existingStats = await db.category_usage_stats
    .where("user_id")
    .equals(userId)
    .filter((stat) => stat.category_id === categoryId)
    .first();

  const now = new Date().toISOString();
  const transactionDateObj = new Date(transactionDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (existingStats) {
    // Update existing stats
    const newCount = existingStats.transaction_count + 1;
    const newLastUsed =
      !existingStats.last_used_at ||
      transactionDateObj > new Date(existingStats.last_used_at)
        ? transactionDate
        : existingStats.last_used_at;

    // Recalculate moving averages
    const movingAvg30d = await calculateMovingAverage(userId, categoryId, 30);
    const movingAvg7d = await calculateMovingAverage(userId, categoryId, 7);

    await db.category_usage_stats.update(existingStats.id, {
      transaction_count: newCount,
      last_used_at: newLastUsed,
      moving_average_30d: movingAvg30d,
      moving_average_7d: movingAvg7d,
      updated_at: now,
      pendingSync: 1,
    });
  } else {
    // Create new stats
    const movingAvg30d = await calculateMovingAverage(userId, categoryId, 30);
    const movingAvg7d = await calculateMovingAverage(userId, categoryId, 7);

    await db.category_usage_stats.add({
      id: uuidv4(),
      user_id: userId,
      category_id: categoryId,
      transaction_count: 1,
      last_used_at: transactionDate,
      moving_average_30d: movingAvg30d,
      moving_average_7d: movingAvg7d,
      updated_at: now,
      created_at: now,
      pendingSync: 1,
    });
  }
};

/**
 * Recalculate all category usage statistics for a user.
 * Useful for initial setup or data corrections.
 */
export const recalculateAllCategoryUsageStats = async (
  userId: string
): Promise<void> => {
  // Get all expense transactions for user
  const transactions = await db.transactions
    .where("user_id")
    .equals(userId)
    .filter((tx) => tx.type === "expense" && tx.deleted_at == null)
    .toArray();

  // Get all expense categories
  const categories = await db.categories
    .where("user_id")
    .equals(userId)
    .filter((cat) => cat.type === "expense" && cat.deleted_at == null)
    .toArray();

  // Group transactions by category
  const categoryStats = new Map<
    string,
    {
      count: number;
      lastUsed: string | null;
      movingAvg30d: number;
      movingAvg7d: number;
    }
  >();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const tx of transactions) {
    const stats = categoryStats.get(tx.category_id) || {
      count: 0,
      lastUsed: null,
      movingAvg30d: 0,
      movingAvg7d: 0,
    };

    stats.count++;
    const txDate = new Date(tx.date);
    if (!stats.lastUsed || txDate > new Date(stats.lastUsed)) {
      stats.lastUsed = tx.date;
    }
    if (txDate >= thirtyDaysAgo) {
      stats.movingAvg30d++;
    }
    if (txDate >= sevenDaysAgo) {
      stats.movingAvg7d++;
    }

    categoryStats.set(tx.category_id, stats);
  }

  // Update or create stats for each category
  const nowStr = new Date().toISOString();
  for (const category of categories) {
    const stats = categoryStats.get(category.id) || {
      count: 0,
      lastUsed: null,
      movingAvg30d: 0,
      movingAvg7d: 0,
    };

    const existing = await db.category_usage_stats
      .where("user_id")
      .equals(userId)
      .filter((stat) => stat.category_id === category.id)
      .first();

    if (existing) {
      await db.category_usage_stats.update(existing.id, {
        transaction_count: stats.count,
        last_used_at: stats.lastUsed,
        moving_average_30d: stats.movingAvg30d,
        moving_average_7d: stats.movingAvg7d,
        updated_at: nowStr,
        pendingSync: 1,
      });
    } else if (stats.count > 0) {
      await db.category_usage_stats.add({
        id: uuidv4(),
        user_id: userId,
        category_id: category.id,
        transaction_count: stats.count,
        last_used_at: stats.lastUsed,
        moving_average_30d: stats.movingAvg30d,
        moving_average_7d: stats.movingAvg7d,
        updated_at: nowStr,
        created_at: nowStr,
        pendingSync: 1,
      });
    }
  }
};

/**
 * Get usage statistics for a specific category.
 */
export const getCategoryUsageStats = async (
  userId: string,
  categoryId: string
): Promise<CategoryUsageStats | undefined> => {
  return await db.category_usage_stats
    .where("user_id")
    .equals(userId)
    .filter((stat) => stat.category_id === categoryId)
    .first();
};

/**
 * Get all usage statistics for a user.
 */
export const getAllCategoryUsageStats = async (
  userId: string
): Promise<CategoryUsageStats[]> => {
  return await db.category_usage_stats
    .where("user_id")
    .equals(userId)
    .toArray();
};
