export type ImportSource = 'antigravity_backup' | 'legacy_vue' | 'generic_csv' | 'intesa_sanpaolo' | 'revolut';


export interface ParsedTransaction {
    id?: string; // Might be present in backups
    date: string;
    amount: number;
    currency?: string;
    description: string;
    category_id?: string;
    context_id?: string; // For GoNuts backups
    type?: "expense" | "income" | "investment"; // Often missing in CSVs
    group_id?: string; // For group expenses
    user_id?: string; // For checking ownership
    raw_data?: unknown; // Original row/object for debugging
}

// Assuming ParsedCategory, ParsedContext, ParsedRecurringTransaction are new types the user intends to introduce or already exist elsewhere.
import { Category } from "@/lib/db";

export type ParsedCategory = {
    id: string;
    name: string;
    type: "income" | "expense" | "investment";
    icon?: string;
    color: string;
    parent_id?: string;
    active?: number | boolean;
    budget?: number;
    // Legacy Vue fields
    title?: string;
    parentCategoryId?: string;
    parentId?: string;
    [key: string]: unknown
};

export type ParsedContext = {
    id?: string;
    name: string;
    description?: string;
    [key: string]: unknown;
};

export type ParsedRecurringTransaction = {
    id?: string;
    amount: string; // Often string from import
    description: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    category_id?: string;
    context_id?: string;
    type: "income" | "expense" | "investment";
    active?: number;
    // Legacy Vue fields
    categoryId?: string;
    nextOccurrence?: string;
    startDate?: string;
    isActive?: boolean;
    [key: string]: unknown;
};

export interface PotentialMerge {
    imported: ParsedCategory;
    existing: Category;
    score: number;
}

export interface RecurringConflict {
    imported: ParsedRecurringTransaction;
    existing: { id: string; description: string; amount: number;[key: string]: unknown };
    score: number; // 0 = exact match
}

export type ParsedBudget = {
    category_id: string;
    amount: number;
    period: "monthly" | "yearly";
    [key: string]: unknown;
};

export type ParsedGroup = {
    id: string;
    name: string;
    [key: string]: unknown;
};

export type ParsedGroupMember = {
    id: string;
    group_id: string;
    user_id: string;
    share?: number;
    [key: string]: unknown;
};

export interface ParsedData {
    source: ImportSource; // Changed to use the updated ImportSource
    transactions: ParsedTransaction[];
    categories?: ParsedCategory[]; // Optional, as some sources might not have them
    recurring?: ParsedRecurringTransaction[];
    contexts?: ParsedContext[];
    budgets?: ParsedBudget[];      // Used for full backups
    groups?: ParsedGroup[];
    group_members?: ParsedGroupMember[];
    metadata?: {
        totalItems: number;
        version?: string;
    };
    dataIntegrityIssues?: {
        orphanedTransactionCategories: { description: string; categoryId: string }[];
        orphanedRecurringCategories: { description: string; categoryId: string }[];
    };
}

export type CsvMapping = {
    dateColumn: string;
    amountColumn: string;
    feeColumn?: string;
    categoryColumn?: string;
    descriptionColumn: string;
    dateFormat?: string;
    hasHeader: boolean;
};

export interface ImportOptions {
    csvMapping?: CsvMapping;
    includeSavings?: boolean;
}

export interface TransactionParser {
    name: string;
    fileExtensions: string[];
    canParse(file: File, content: string): Promise<boolean>;
    parse(file: File, content: string, options?: ImportOptions): Promise<ParsedData>;
}

export interface ImportRule {
    id: string;
    match_string: string; // "STARBUCKS"
    match_type: 'contains' | 'exact' | 'regex'; // Retained from original
    category_id: string;
    created_at: string; // Retained from original
    active?: boolean; // Added based on the provided snippet, making it optional to avoid breaking existing usage
}
