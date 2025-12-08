import { z } from "zod";
import { TFunction } from "i18next";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const getUuidSchema = (t: TFunction) => z.string().uuid(t("validation.invalid_uuid"));

export const getTransactionTypeSchema = (t: TFunction) => z.enum(["income", "expense", "investment"], {
  message: t("validation.invalid_type"),
});

export const getDateStringSchema = (t: TFunction) => z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.invalid_date"));

export const getYearMonthSchema = (t: TFunction) => z
  .string()
  .regex(/^\d{4}-\d{2}$/, t("validation.invalid_year_month"));

export const getFrequencySchema = (t: TFunction) => z.enum(["daily", "weekly", "monthly", "yearly"], {
  message: t("validation.invalid_frequency"),
});

// ============================================================================
// TRANSACTION SCHEMA
// ============================================================================

export const getTransactionInputSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  group_id: z.string().uuid().nullable().optional(),
  paid_by_member_id: z.string().uuid().nullable().optional(),
  category_id: getUuidSchema(t),
  context_id: z.string().uuid().optional(),
  type: getTransactionTypeSchema(t),
  amount: z
    .number()
    .positive(t("validation.amount_positive"))
    .finite(t("validation.amount_finite")),
  date: getDateStringSchema(t),
  year_month: getYearMonthSchema(t),
  description: z
    .string()
    .min(1, t("validation.description_required"))
    .max(500, t("validation.description_max")),
});

export const getTransactionUpdateSchema = (t: TFunction) => getTransactionInputSchema(t).partial().omit({
  user_id: true,
});

export type TransactionInput = z.infer<ReturnType<typeof getTransactionInputSchema>>;
export type TransactionUpdate = z.infer<ReturnType<typeof getTransactionUpdateSchema>>;

// ============================================================================
// CATEGORY SCHEMA
// ============================================================================

export const getCategoryInputSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  group_id: z.string().uuid().nullable().optional(),
  name: z
    .string()
    .min(1, t("validation.category_name_required"))
    .max(100, t("validation.category_name_max")),
  icon: z.string().min(1, t("validation.icon_required")),
  color: z.string().min(1, t("validation.color_required")),
  type: getTransactionTypeSchema(t),
  parent_id: z.string().uuid().optional(),
  active: z.number().int().min(0).max(1).default(1),
});

export const getCategoryUpdateSchema = (t: TFunction) => getCategoryInputSchema(t).partial().omit({
  user_id: true,
});

export type CategoryInput = z.infer<ReturnType<typeof getCategoryInputSchema>>;
export type CategoryUpdate = z.infer<ReturnType<typeof getCategoryUpdateSchema>>;

// ============================================================================
// RECURRING TRANSACTION SCHEMA
// ============================================================================

export const getRecurringTransactionInputSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  group_id: z.string().uuid().nullable().optional(),
  paid_by_member_id: z.string().uuid().nullable().optional(),
  type: getTransactionTypeSchema(t),
  category_id: getUuidSchema(t),
  context_id: z.string().uuid().optional(),
  amount: z
    .number()
    .positive(t("validation.amount_positive"))
    .finite(t("validation.amount_finite")),
  description: z
    .string()
    .min(1, t("validation.description_required"))
    .max(500, t("validation.description_max")),
  frequency: getFrequencySchema(t),
  start_date: getDateStringSchema(t),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  active: z.number().int().min(0).max(1).default(1),
});

export const getRecurringTransactionUpdateSchema = (t: TFunction) =>
  getRecurringTransactionInputSchema(t).partial().omit({
    user_id: true,
  });

export type RecurringTransactionInput = z.infer<ReturnType<typeof getRecurringTransactionInputSchema>>;
export type RecurringTransactionUpdate = z.infer<ReturnType<typeof getRecurringTransactionUpdateSchema>>;

// ============================================================================
// GROUP SCHEMA
// ============================================================================

export const getGroupInputSchema = (t: TFunction) => z.object({
  name: z
    .string()
    .min(1, t("validation.group_name_required"))
    .max(100, t("validation.group_name_max")),
  description: z
    .string()
    .max(500, t("validation.group_description_max"))
    .optional(),
  created_by: getUuidSchema(t),
});

export const getGroupUpdateSchema = (t: TFunction) => getGroupInputSchema(t).partial().omit({
  created_by: true,
});

export type GroupInput = z.infer<ReturnType<typeof getGroupInputSchema>>;
export type GroupUpdate = z.infer<ReturnType<typeof getGroupUpdateSchema>>;

// ============================================================================
// GROUP MEMBER SCHEMA
// ============================================================================

export const getGroupMemberInputSchema = (t: TFunction) => z.object({
  group_id: getUuidSchema(t),
  user_id: getUuidSchema(t),
  share: z
    .number()
    .min(0, t("validation.share_min"))
    .max(100, t("validation.share_max")),
});

export const getGroupMemberUpdateSchema = (t: TFunction) => z.object({
  share: z
    .number()
    .min(0, t("validation.share_min"))
    .max(100, t("validation.share_max")),
});

export type GroupMemberInput = z.infer<ReturnType<typeof getGroupMemberInputSchema>>;
export type GroupMemberUpdate = z.infer<ReturnType<typeof getGroupMemberUpdateSchema>>;

// ============================================================================
// CATEGORY BUDGET SCHEMA
// ============================================================================

export const getBudgetPeriodSchema = (t: TFunction) => z.enum(["monthly", "yearly"], {
  message: t("validation.invalid_period"),
});

export const getCategoryBudgetInputSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  category_id: getUuidSchema(t),
  amount: z
    .number()
    .positive(t("validation.budget_positive"))
    .finite(t("validation.amount_finite")),
  period: getBudgetPeriodSchema(t),
});

export const getCategoryBudgetUpdateSchema = (t: TFunction) =>
  getCategoryBudgetInputSchema(t).partial().omit({
    user_id: true,
  });

export type CategoryBudgetInput = z.infer<ReturnType<typeof getCategoryBudgetInputSchema>>;
export type CategoryBudgetUpdate = z.infer<ReturnType<typeof getCategoryBudgetUpdateSchema>>;

// ============================================================================
// USER SETTINGS SCHEMA
// ============================================================================

export const getUserSettingsSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  currency: z
    .string()
    .length(3, t("validation.currency_length"))
    .default("EUR"),
  language: z.string().min(2).max(5).default("en"),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  accentColor: z.string().default("slate"),
  start_of_week: z.enum(["monday", "sunday"]).default("monday"),
  default_view: z.enum(["list", "grid"]).default("list"),
  include_investments_in_expense_totals: z.boolean().default(false),
  include_group_expenses: z.boolean().default(false),
  monthly_budget: z.number().positive().nullable().optional(),
});

export const getUserSettingsUpdateSchema = (t: TFunction) => getUserSettingsSchema(t).partial().omit({
  user_id: true,
});

export type UserSettingsInput = z.infer<ReturnType<typeof getUserSettingsSchema>>;
export type UserSettingsUpdate = z.infer<ReturnType<typeof getUserSettingsUpdateSchema>>;

// ============================================================================
// CONTEXT SCHEMA
// ============================================================================

export const getContextInputSchema = (t: TFunction) => z.object({
  user_id: getUuidSchema(t),
  name: z
    .string()
    .min(1, t("validation.context_name_required"))
    .max(50, t("validation.context_name_max")),
  description: z
    .string()
    .max(200, t("validation.description_max"))
    .nullable()
    .optional(),
  active: z.number().int().min(0).max(1).default(1),
});

export const getContextUpdateSchema = (t: TFunction) => getContextInputSchema(t).partial().omit({
  user_id: true,
});

export type ContextInput = z.infer<ReturnType<typeof getContextInputSchema>>;
export type ContextUpdate = z.infer<ReturnType<typeof getContextUpdateSchema>>;


// ============================================================================
// VALIDATION HELPER
// ============================================================================

export class ValidationError extends Error {
  public errors: z.ZodIssue[];

  constructor(errors: z.ZodIssue[]) {
    const message = errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/**
 * Validates data against a Zod schema.
 * Throws ValidationError if validation fails.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}

/**
 * Validates data and returns a result object instead of throwing.
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: result.error.issues };
  }
  return { success: true, data: result.data };
}
