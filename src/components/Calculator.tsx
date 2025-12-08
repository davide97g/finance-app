import { Button } from "@/components/ui/button";
import { Divide, Equal, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorProps {
    onOperation: (op: string) => void;
    onEqual: () => void;
    activeOperation: string | null;
    className?: string;
}

export function Calculator({
    onOperation,
    onEqual,
    activeOperation,
    className,
}: CalculatorProps) {
    const ops = [
        { label: "/", icon: Divide },
        { label: "*", icon: X },
        { label: "-", icon: Minus },
        { label: "+", icon: Plus },
    ];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {ops.map((op) => (
                <Button
                    key={op.label}
                    type="button"
                    variant={activeOperation === op.label ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                        "flex-1 h-9",
                        activeOperation === op.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onOperation(op.label)}
                >
                    <op.icon className="h-4 w-4" />
                </Button>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-9 border-primary/20 text-primary hover:bg-primary/10"
                onClick={onEqual}
            >
                <Equal className="h-4 w-4" />
            </Button>
        </div>
    );
}
