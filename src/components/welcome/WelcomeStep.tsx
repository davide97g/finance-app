import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface WelcomeStepProps {
    icon: LucideIcon;
    iconColor?: string;
    title: string;
    description: string;
    children?: ReactNode;
}

export function WelcomeStep({
    icon: Icon,
    iconColor = "hsl(var(--primary))",
    title,
    description,
    children,
}: WelcomeStepProps) {
    return (
        <div className="flex flex-col items-center text-center px-6 py-4">
            {/* Animated Icon */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                }}
                className="mb-6"
            >
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${iconColor}20` }}
                >
                    <Icon
                        className="w-10 h-10"
                        style={{ color: iconColor }}
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-3"
            >
                {title}
            </motion.h2>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-base leading-relaxed max-w-sm"
            >
                {description}
            </motion.p>

            {/* Optional preview content */}
            {children && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 w-full"
                >
                    {children}
                </motion.div>
            )}
        </div>
    );
}
