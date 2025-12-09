import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    variant?: "default" | "error" | "loading";
}

/**
 * EmptyState component for displaying empty, loading, or error states
 * with animated icons and consistent styling.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
    variant = "default",
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center animate-[fade-in_0.3s_ease-out]",
                className
            )}
        >
            {Icon && (
                <div
                    className={cn(
                        "mb-4 rounded-full p-4 transition-transform duration-300",
                        variant === "default" && "bg-muted/50 text-muted-foreground",
                        variant === "error" && "bg-destructive/10 text-destructive",
                        variant === "loading" && "bg-primary/10 text-primary animate-pulse"
                    )}
                >
                    <Icon
                        className={cn(
                            "h-10 w-10",
                            variant === "loading" && "animate-[spin_2s_linear_infinite]"
                        )}
                    />
                </div>
            )}
            <h3
                className={cn(
                    "text-lg font-semibold mb-1",
                    variant === "error" && "text-destructive"
                )}
            >
                {title}
            </h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
