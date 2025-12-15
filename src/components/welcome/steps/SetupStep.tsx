import { useTranslation } from "react-i18next";
import { User, Wallet, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Theme } from "@/lib/types";

interface SetupStepProps {
    userName: string;
    setUserName: (name: string) => void;
    monthlyBudget: string;
    setMonthlyBudget: (budget: string) => void;
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
}

export function SetupStep({
    userName,
    setUserName,
    monthlyBudget,
    setMonthlyBudget,
    currentTheme,
    setTheme,
}: SetupStepProps) {
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-sm mx-auto space-y-6 px-4">
            {/* User Name Input */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
            >
                <Label htmlFor="name" className="text-muted-foreground">
                    {t("welcome.whats_your_name")}
                </Label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder={t("welcome.your_name")}
                        className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                        autoComplete="off"
                    />
                </div>
            </motion.div>

            {/* Monthly Budget Input */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
            >
                <Label htmlFor="budget" className="text-muted-foreground">
                    {t("welcome.monthly_budget")}
                </Label>
                <div className="relative">
                    <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="budget"
                        type="number"
                        value={monthlyBudget}
                        onChange={(e) => setMonthlyBudget(e.target.value)}
                        placeholder={t("welcome.budget_placeholder")}
                        className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>
            </motion.div>

            {/* Theme Selection */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
            >
                <Label className="text-muted-foreground">
                    {t("welcome.select_theme")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { value: "light", label: t("light"), color: "bg-white border-zinc-200" },
                        { value: "dark", label: t("dark"), color: "bg-zinc-950 border-zinc-800" },
                        { value: "system", label: t("system"), color: "bg-gradient-to-br from-white to-zinc-950 border-zinc-400" },
                    ].map((mode) => (
                        <Button
                            key={mode.value}
                            variant="outline"
                            size="sm"
                            onClick={() => setTheme(mode.value as Theme)}
                            className={cn(
                                "relative h-14 border-2 flex flex-col gap-1 items-center justify-center hover:bg-accent/50",
                                currentTheme === mode.value
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-muted bg-transparent text-muted-foreground"
                            )}
                        >
                            <div className={cn("w-full h-2 rounded-full opacity-50", mode.color)} />
                            <span className="text-[10px] sm:text-xs capitalize">{mode.label}</span>
                            {currentTheme === mode.value && (
                                <div className="absolute top-1 right-1 text-primary">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </Button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
