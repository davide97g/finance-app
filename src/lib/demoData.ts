/**
 * Demo data for Welcome Wizard
 * Provides realistic mock data to showcase app features during onboarding
 */

import { format, subDays, startOfMonth } from "date-fns";

// Demo user ID (fake, never used in real DB)
const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";
const DEMO_GROUP_ID = "demo-group-00000000-0000-0000-0000-000000001";

// Category IDs
const CAT_GROCERIES = "demo-cat-groceries";
const CAT_FOOD = "demo-cat-food";
const CAT_RESTAURANTS = "demo-cat-restaurants";
const CAT_COFFEE = "demo-cat-coffee";
const CAT_TRANSPORT = "demo-cat-transport";
const CAT_FUEL = "demo-cat-fuel";
const CAT_PUBLIC = "demo-cat-public";
const CAT_ENTERTAINMENT = "demo-cat-entertainment";
const CAT_BILLS = "demo-cat-bills";
const CAT_ELECTRICITY = "demo-cat-electricity";
const CAT_INTERNET = "demo-cat-internet";
const CAT_SALARY = "demo-cat-salary";
const CAT_INVESTMENTS = "demo-cat-investments";

// Context IDs
const CTX_VACATION = "demo-ctx-vacation";
const CTX_WORK = "demo-ctx-work";

// Helper to generate dates relative to today
const today = new Date();
const currentMonth = format(today, "yyyy-MM");

// Demo Categories with hierarchy
export const demoCategories = [
    // Parent categories
    {
        id: CAT_FOOD,
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#f97316",
        type: "expense" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_TRANSPORT,
        name: "Transport",
        icon: "Car",
        color: "#3b82f6",
        type: "expense" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_ENTERTAINMENT,
        name: "Entertainment",
        icon: "Gamepad2",
        color: "#a855f7",
        type: "expense" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_BILLS,
        name: "Bills",
        icon: "Receipt",
        color: "#ef4444",
        type: "expense" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_SALARY,
        name: "Salary",
        icon: "Banknote",
        color: "#22c55e",
        type: "income" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_INVESTMENTS,
        name: "Investments",
        icon: "TrendingUp",
        color: "#06b6d4",
        type: "investment" as const,
        parent_id: null,
        active: true,
        user_id: DEMO_USER_ID,
    },
    // Child categories
    {
        id: CAT_GROCERIES,
        name: "Groceries",
        icon: "ShoppingCart",
        color: "#fb923c",
        type: "expense" as const,
        parent_id: CAT_FOOD,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_RESTAURANTS,
        name: "Restaurants",
        icon: "Utensils",
        color: "#fdba74",
        type: "expense" as const,
        parent_id: CAT_FOOD,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_COFFEE,
        name: "Coffee & Bars",
        icon: "Coffee",
        color: "#fcd34d",
        type: "expense" as const,
        parent_id: CAT_FOOD,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_FUEL,
        name: "Fuel",
        icon: "Fuel",
        color: "#60a5fa",
        type: "expense" as const,
        parent_id: CAT_TRANSPORT,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_PUBLIC,
        name: "Public Transport",
        icon: "Train",
        color: "#93c5fd",
        type: "expense" as const,
        parent_id: CAT_TRANSPORT,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_ELECTRICITY,
        name: "Electricity",
        icon: "Zap",
        color: "#f87171",
        type: "expense" as const,
        parent_id: CAT_BILLS,
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CAT_INTERNET,
        name: "Internet",
        icon: "Wifi",
        color: "#fca5a5",
        type: "expense" as const,
        parent_id: CAT_BILLS,
        active: true,
        user_id: DEMO_USER_ID,
    },
];

// Demo Contexts
export const demoContexts = [
    {
        id: CTX_VACATION,
        name: "🏖️",
        description: "Summer vacation expenses",
        active: true,
        user_id: DEMO_USER_ID,
    },
    {
        id: CTX_WORK,
        name: "💼",
        description: "Work-related expenses",
        active: true,
        user_id: DEMO_USER_ID,
    },
];

// Demo Group
export const demoGroups = [
    {
        id: DEMO_GROUP_ID,
        name: "Casa",
        description: "Shared household expenses",
        created_by: DEMO_USER_ID,
    },
];

// Demo Group Members
export const demoGroupMembers = [
    {
        id: "demo-member-1",
        group_id: DEMO_GROUP_ID,
        user_id: DEMO_USER_ID,
        share: 50,
    },
    {
        id: "demo-member-2",
        group_id: DEMO_GROUP_ID,
        user_id: "demo-partner-id",
        share: 50,
    },
];

// Demo Transactions - realistic spending over the current month
export const demoTransactions = [
    // Income
    {
        id: "demo-tx-salary",
        description: "Monthly Salary",
        amount: 2800,
        type: "income" as const,
        category_id: CAT_SALARY,
        date: format(startOfMonth(today), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    // Regular expenses
    {
        id: "demo-tx-1",
        description: "Grocery shopping - Esselunga",
        amount: 87.50,
        type: "expense" as const,
        category_id: CAT_GROCERIES,
        date: format(subDays(today, 1), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-2",
        description: "Dinner at Pizzeria",
        amount: 45.00,
        type: "expense" as const,
        category_id: CAT_RESTAURANTS,
        date: format(subDays(today, 2), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-3",
        description: "Coffee with colleagues",
        amount: 4.50,
        type: "expense" as const,
        category_id: CAT_COFFEE,
        date: format(subDays(today, 2), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
        context_id: CTX_WORK,
    },
    {
        id: "demo-tx-4",
        description: "Fuel - ENI Station",
        amount: 65.00,
        type: "expense" as const,
        category_id: CAT_FUEL,
        date: format(subDays(today, 3), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-5",
        description: "Netflix subscription",
        amount: 15.99,
        type: "expense" as const,
        category_id: CAT_ENTERTAINMENT,
        date: format(subDays(today, 4), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-6",
        description: "Weekly groceries",
        amount: 112.30,
        type: "expense" as const,
        category_id: CAT_GROCERIES,
        date: format(subDays(today, 5), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-7",
        description: "Train ticket to Milan",
        amount: 28.90,
        type: "expense" as const,
        category_id: CAT_PUBLIC,
        date: format(subDays(today, 6), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
        context_id: CTX_WORK,
    },
    {
        id: "demo-tx-8",
        description: "Electricity bill",
        amount: 95.00,
        type: "expense" as const,
        category_id: CAT_ELECTRICITY,
        date: format(subDays(today, 7), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-9",
        description: "Internet - Fastweb",
        amount: 29.90,
        type: "expense" as const,
        category_id: CAT_INTERNET,
        date: format(subDays(today, 7), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    {
        id: "demo-tx-10",
        description: "Lunch at work",
        amount: 12.00,
        type: "expense" as const,
        category_id: CAT_RESTAURANTS,
        date: format(subDays(today, 8), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
        context_id: CTX_WORK,
    },
    // Investment
    {
        id: "demo-tx-investment",
        description: "ETF Monthly Investment",
        amount: 200,
        type: "investment" as const,
        category_id: CAT_INVESTMENTS,
        date: format(subDays(today, 5), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
    },
    // Group expense
    {
        id: "demo-tx-group",
        description: "Grocery shopping (shared)",
        amount: 156.80,
        type: "expense" as const,
        category_id: CAT_GROCERIES,
        date: format(subDays(today, 3), "yyyy-MM-dd"),
        year_month: currentMonth,
        user_id: DEMO_USER_ID,
        group_id: DEMO_GROUP_ID,
    },
];

// Demo User Settings
export const demoSettings = {
    user_id: DEMO_USER_ID,
    currency: "€",
    monthly_budget: 2500,
    theme: "system",
    language: "en",
    include_investments_in_expense_totals: false,
    include_group_expenses: true,
    start_of_week: "monday",
};

// Computed demo statistics
export const getDemoStats = () => {
    const expenses = demoTransactions.filter((t) => t.type === "expense");
    const income = demoTransactions.filter((t) => t.type === "income");

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    return {
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
        budgetUsed: (totalExpenses / demoSettings.monthly_budget) * 100,
        transactionCount: demoTransactions.length,
        categoryBreakdown: [
            { name: "Food", amount: 261.30, percentage: 37 },
            { name: "Bills", amount: 124.90, percentage: 18 },
            { name: "Transport", amount: 93.90, percentage: 13 },
            { name: "Entertainment", amount: 15.99, percentage: 2 },
        ],
    };
};

// Export all demo data as a bundle
export const demoData = {
    categories: demoCategories,
    contexts: demoContexts,
    groups: demoGroups,
    groupMembers: demoGroupMembers,
    transactions: demoTransactions,
    settings: demoSettings,
    getStats: getDemoStats,
};
