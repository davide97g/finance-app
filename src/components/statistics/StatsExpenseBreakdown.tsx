import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChildCategory {
    name: string;
    amount: number;
    color: string;
}

interface ExpenseHierarchyItem {
    rootName: string;
    rootColor: string;
    total: number;
    _children: ChildCategory[];
    [key: string]: unknown;
}

interface StatsExpenseBreakdownProps {
    expensesByHierarchy: ExpenseHierarchyItem[];
    totalExpense: number;
    isLoading?: boolean;
}

export function StatsExpenseBreakdown({
    expensesByHierarchy,
    totalExpense,
    isLoading = false,
}: StatsExpenseBreakdownProps) {
    const { t } = useTranslation();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpand = (itemName: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(itemName)) {
                next.delete(itemName);
            } else {
                next.add(itemName);
            }
            return next;
        });
    };

    // Sort by total descending
    const sortedData = [...expensesByHierarchy].sort((a, b) => b.total - a.total);

    if (expensesByHierarchy.length === 0 && !isLoading) {
        return (
            <Card className="min-w-0">
                <CardHeader>
                    <CardTitle>{t("expense_breakdown")}</CardTitle>
                    <CardDescription>{t("expense_breakdown_desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                        {t("no_data")}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="min-w-0">
            <CardHeader className="pb-3">
                <CardTitle>{t("expense_breakdown")}</CardTitle>
                <CardDescription>{t("expense_breakdown_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-3 sm:px-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 bg-muted animate-pulse rounded-lg"
                            />
                        ))}
                    </div>
                ) : (
                    sortedData.map((item) => {
                        const isExpanded = expandedItems.has(item.rootName);
                        const percentage = totalExpense > 0
                            ? (item.total / totalExpense) * 100
                            : 0;
                        const hasChildren = item._children.length > 1;

                        return (
                            <div
                                key={item.rootName}
                                className="rounded-lg border bg-card overflow-hidden transition-all duration-200"
                            >
                                {/* Parent Category Header */}
                                <button
                                    onClick={() => hasChildren && toggleExpand(item.rootName)}
                                    disabled={!hasChildren}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 text-left transition-colors",
                                        hasChildren && "hover:bg-accent/50 cursor-pointer",
                                        !hasChildren && "cursor-default"
                                    )}
                                >
                                    {/* Color indicator */}
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: item.rootColor }}
                                    />

                                    {/* Category info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium truncate text-sm">
                                                {item.rootName}
                                            </span>
                                            <span className="font-semibold text-sm ml-2 shrink-0">
                                                €{item.total.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${Math.max(percentage, 1)}%`,
                                                    backgroundColor: item.rootColor,
                                                }}
                                            />
                                        </div>

                                        {/* Percentage */}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {percentage.toFixed(1)}%
                                            {hasChildren && (
                                                <span className="ml-1">
                                                    · {item._children.length} {t("subcategories")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand/Collapse indicator */}
                                    {hasChildren && (
                                        <div className="shrink-0 text-muted-foreground">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </div>
                                    )}
                                </button>

                                {/* Children - Expandable Section */}
                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="border-t bg-accent/20 px-3 py-2 space-y-2">
                                        {item._children
                                            .sort((a, b) => b.amount - a.amount)
                                            .map((child, index) => {
                                                const childPercentage = item.total > 0
                                                    ? (child.amount / item.total) * 100
                                                    : 0;

                                                return (
                                                    <div
                                                        key={child.name}
                                                        className="flex items-center gap-3 py-1.5 pl-6"
                                                        style={{
                                                            animationDelay: `${index * 50}ms`,
                                                        }}
                                                    >
                                                        {/* Tree connector */}
                                                        <div className="absolute left-6 w-3 border-l-2 border-b-2 border-muted-foreground/20 h-4 rounded-bl-sm" />

                                                        {/* Color dot */}
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0 opacity-70"
                                                            style={{ backgroundColor: item.rootColor }}
                                                        />

                                                        {/* Child info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm truncate text-muted-foreground">
                                                                    {child.name}
                                                                </span>
                                                                <span className="text-sm ml-2 shrink-0">
                                                                    €{child.amount.toFixed(2)}
                                                                </span>
                                                            </div>

                                                            {/* Mini progress bar */}
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className="flex-1 bg-muted rounded-full h-1">
                                                                    <div
                                                                        className="h-1 rounded-full transition-all duration-300"
                                                                        style={{
                                                                            width: `${Math.max(childPercentage, 1)}%`,
                                                                            backgroundColor: item.rootColor,
                                                                            opacity: 0.6,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                                                                    {childPercentage.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
