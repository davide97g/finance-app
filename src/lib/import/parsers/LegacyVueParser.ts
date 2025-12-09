import { TransactionParser, ParsedData, ParsedTransaction } from "../types";

export class LegacyVueParser implements TransactionParser {
    name = "Legacy Vue App Export";
    fileExtensions = ["json"];

    async canParse(_file: File, content: string): Promise<boolean> {
        try {
            const data = JSON.parse(content);
            return data.source === 'vue-firebase-expense-tracker';
        } catch {
            return false;
        }
    }

    async parse(_file: File, content: string): Promise<ParsedData> {
        const data = JSON.parse(content);
        const vueData = data.data || {};

        // Transform transactions
        const transactions: ParsedTransaction[] = (vueData.transactions || []).map((t: any) => ({
            // We don't preserve IDs from Vue usually, or we map them. 
            // But here we just normalize data. The Processor will handle ID mapping.
            // Actually, we pass the Old Category ID here so the processor can map it.
            date: t.timestamp.split("T")[0],
            amount: parseFloat(t.amount),
            description: t.description || "",
            // Important: We pass the OLD category ID. The Processor needs to resolve this 
            // using the categories list which is also returning.
            category_id: t.categoryId,
            type: undefined, // Type in Vue is derived from Category, so we can't know it yet easily without context
            raw_data: t
        }));

        return {
            source: 'legacy_vue',
            transactions,
            categories: vueData.categories || [],
            recurring: vueData.recurringExpenses || [],
            // Vue didn't have contexts or separate budgets table in the same way
            contexts: [],
            budgets: [],
            metadata: {
                totalItems: transactions.length + (vueData.categories?.length || 0)
            }
        };
    }
}
