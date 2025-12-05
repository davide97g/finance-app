import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            role="status"
            aria-label="Loading content"
            aria-live="polite"
            aria-busy="true"
            className={cn(
                // Base styles
                "relative overflow-hidden rounded-md bg-muted",
                // Shimmer effect
                "before:absolute before:inset-0",
                "before:-translate-x-full before:animate-shimmer",
                "before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/10 before:to-transparent",
                // Performance optimization
                "will-change-transform",
                className
            )}
            {...props}
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}

export { Skeleton }
