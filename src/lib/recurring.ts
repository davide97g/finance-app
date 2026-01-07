import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  isBefore,
  parseISO,
} from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { insertRecord, updateRecord } from "./dbOperations";

/**
 * Processes all active recurring transactions and generates new transactions
 * if they are due.
 *
 * @returns The number of new transactions generated.
 */
export async function processRecurringTransactions(): Promise<number> {
  const all = await db.recurring_transactions.toArray();
  const active = all.filter((rt) => !rt.deleted_at);
  const now = new Date();
  let generatedCount = 0;

  for (const rt of active) {
    if (!rt.active || rt.deleted_at) continue;

    let nextDate = rt.last_generated
      ? parseISO(rt.last_generated)
      : parseISO(rt.start_date);

    // If never generated, start from start_date. If generated, calculate next.
    if (rt.last_generated) {
      switch (rt.frequency) {
        case "daily":
          nextDate = addDays(nextDate, 1);
          break;
        case "weekly":
          nextDate = addWeeks(nextDate, 1);
          break;
        case "monthly":
          nextDate = addMonths(nextDate, 1);
          break;
        case "yearly":
          nextDate = addYears(nextDate, 1);
          break;
      }
    }

    // Generate all missed transactions up to today
    while (
      isBefore(nextDate, now) ||
      nextDate.toDateString() === now.toDateString()
    ) {
      // Check end_date
      if (rt.end_date && isBefore(parseISO(rt.end_date), nextDate)) break;

      // Create transaction
      const transactionId = uuidv4();
      // Use format to get local date string YYYY-MM-DD
      const dateStr = format(nextDate, "yyyy-MM-dd");

      const transactionData = {
        id: transactionId,
        user_id: rt.user_id,
        group_id: rt.group_id || null,
        paid_by_member_id: rt.paid_by_member_id || null,
        category_id: rt.category_id,
        context_id: rt.context_id,
        type: rt.type,
        amount: rt.amount,
        date: dateStr,
        year_month: dateStr.substring(0, 7),
        description: rt.description || `Recurring: ${rt.frequency}`,
        deleted_at: null,
      };

      // Immediate write
      await insertRecord("transactions", transactionData, rt.user_id);

      // Update last_generated with the date string we just generated for
      await updateRecord(
        "recurring_transactions",
        rt.id,
        {
          last_generated: dateStr,
        },
        rt.user_id
      );

      generatedCount++;

      // Calculate next date for loop
      switch (rt.frequency) {
        case "daily":
          nextDate = addDays(nextDate, 1);
          break;
        case "weekly":
          nextDate = addWeeks(nextDate, 1);
          break;
        case "monthly":
          nextDate = addMonths(nextDate, 1);
          break;
        case "yearly":
          nextDate = addYears(nextDate, 1);
          break;
      }
    }
  }

  return generatedCount;
}
