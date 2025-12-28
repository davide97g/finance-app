import { Category, Transaction, GroupMember, Context, CategoryBudget } from "../lib/db";

export type StatisticsWorkerRequest = {
    type: "CALCULATE_STATS";
    payload: {
        transactions: Transaction[];
        categories: Category[];
        contexts: Context[];
        yearlyTransactions: Transaction[];
        groupId?: string;
        mode: "monthly" | "yearly";
        currentMonth: string; // YYYY-MM
        currentYear: string; // YYYY
        userId?: string;
        groupMemberships?: GroupMember[];
        activeGroupMembers?: GroupMember[];
        categoryBudgets?: CategoryBudget[];
    };
};

export type StatisticsWorkerResponse = {
    type: "STATS_RESULT";
    payload: {
        monthlyStats: { income: number; expense: number; investment: number; byCategory: any[] };
        yearlyStats: { income: number; expense: number; investment: number; byCategory: any[] };
        monthlyNetBalance: number;
        yearlyNetBalance: number;
        monthlyCategoryPercentages: { name: string; value: number; color: string }[];
        yearlyCategoryPercentages: { name: string; value: number; color: string }[];
        monthlyExpensesByHierarchy: any[];
        yearlyExpensesByHierarchy: any[];
        monthlyTrendData: { period: string; income: number; expense: number; balance: number; monthIndex: number }[];
        monthlyCashFlow: { period: string; income: number; expense: number; monthIndex: number }[];
        contextStats: any[];
        dailyCumulativeExpenses: { day: number; cumulative: number }[];
        monthlyExpenses: { month: string; value: number; monthIndex: number }[];
        monthlyIncome: { month: string; value: number; monthIndex: number }[];
        monthlyInvestments: { month: string; value: number; monthIndex: number }[];
        monthlyContextTrends: any[];

        groupBalances: any[];
        monthlyBudgetHealth: any[];
    };
};
