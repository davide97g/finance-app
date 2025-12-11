import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FadeInProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
}

export function FadeIn({ children, className, delay = 0, duration = 300 }: FadeInProps) {
    return (
        <div
            className={cn("animate-fade-in opacity-0 fill-mode-forwards", className)}
            style={{
                animationDuration: `${duration}ms`,
                animationDelay: `${delay}ms`,
                animationFillMode: "forwards"
            }}
        >
            {children}
        </div>
    );
}
