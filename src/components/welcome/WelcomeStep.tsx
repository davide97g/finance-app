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
        <div className="flex flex-col items-center text-center px-4 sm:px-6 py-2 sm:py-4">
            {/* Animated Icon - smaller on mobile */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                }}
                className="mb-3 sm:mb-6"
            >
                <div
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${iconColor}20` }}
                >
                    <Icon
                        className="w-7 h-7 sm:w-10 sm:h-10"
                        style={{ color: iconColor }}
                    />
                </div>
            </motion.div>

            {/* Title - responsive sizing */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3"
            >
                {title}
            </motion.h2>

            {/* Description - with line clamp on mobile */}
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm line-clamp-3 sm:line-clamp-none"
            >
                {description}
            </motion.p>

            {/* Optional preview content - hidden on very small screens for first step */}
            {children && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 sm:mt-6 w-full"
                >
                    {children}
                </motion.div>
            )}
        </div>
    );
}
