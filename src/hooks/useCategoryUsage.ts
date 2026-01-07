/**
 * @fileoverview Hook for managing category usage statistics and sorting.
 *
 * Provides functionality to sort expense categories based on usage statistics
 * according to user preferences.
 *
 * @module hooks/useCategoryUsage
 */

import { useAuth } from "@/contexts/AuthProvider";
import { Category, CategoryUsageStats, db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { useSettings } from "./useSettings";

/**
 * Sort categories by usage statistics according to user settings.
 */
const sortCategoriesByUsage = (
  categories: Category[],
  stats: CategoryUsageStats[],
  strategy: "moving_average" | "total_all_time" | "recent_order",
  days: number
): Category[] => {
  const statsMap = new Map<string, CategoryUsageStats>();
  for (const stat of stats) {
    statsMap.set(stat.category_id, stat);
  }

  return [...categories].sort((a, b) => {
    const statA = statsMap.get(a.id);
    const statB = statsMap.get(b.id);

    // Categories without stats go to the end, sorted alphabetically
    if (!statA && !statB) return a.name.localeCompare(b.name);
    if (!statA) return 1;
    if (!statB) return -1;

    let scoreA = 0;
    let scoreB = 0;

    switch (strategy) {
      case "moving_average":
        // Use moving average based on days setting
        // Default to 30d if days is not 7
        if (days === 7) {
          scoreA = statA.moving_average_7d;
          scoreB = statB.moving_average_7d;
        } else {
          scoreA = statA.moving_average_30d;
          scoreB = statB.moving_average_30d;
        }
        break;
      case "total_all_time":
        scoreA = statA.transaction_count;
        scoreB = statB.transaction_count;
        break;
      case "recent_order": {
        // Sort by last_used_at DESC (most recent first)
        const dateA = statA.last_used_at
          ? new Date(statA.last_used_at).getTime()
          : 0;
        const dateB = statB.last_used_at
          ? new Date(statB.last_used_at).getTime()
          : 0;
        return dateB - dateA; // DESC order
      }
      default:
        return 0;
    }

    // For moving_average and total_all_time, sort DESC (highest first)
    return scoreB - scoreA;
  });
};

/**
 * Hook for managing category usage statistics and sorting.
 *
 * @param categories - Array of categories to sort
 * @returns Sorted categories based on user settings
 */
export const useCategoryUsage = (categories: Category[] | undefined) => {
  const { user } = useAuth();
  const { settings } = useSettings();

  // Fetch all usage stats for the user
  const allStats = useLiveQuery(() => {
    if (!user) return [];
    return db.category_usage_stats.where("user_id").equals(user.id).toArray();
  }, [user?.id]);

  // Sort categories if enabled and strategy is set
  const sortedCategories = useMemo(() => {
    if (!categories || !user || !settings) {
      return categories || [];
    }

    // Only sort expense categories
    const expenseCategories = categories.filter(
      (cat) => cat.type === "expense"
    );
    const otherCategories = categories.filter((cat) => cat.type !== "expense");

    // Check if sorting is enabled
    if (
      !settings.category_sorting_enabled ||
      !settings.category_sorting_strategy ||
      !allStats
    ) {
      // Return original order (alphabetical)
      return categories;
    }

    // Sort expense categories by usage
    const sortedExpense = sortCategoriesByUsage(
      expenseCategories,
      allStats,
      settings.category_sorting_strategy,
      settings.category_sorting_days || 30
    );

    // Combine sorted expense categories with other categories
    // Expense categories first (sorted by usage), then others (alphabetical)
    return [...sortedExpense, ...otherCategories];
  }, [categories, user, settings, allStats]);

  return {
    sortedCategories,
    stats: allStats || [],
  };
};
