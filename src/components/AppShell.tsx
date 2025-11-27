import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Tags,
  Settings,
  Layers,
  PieChart,
  Users,
} from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav } from "@/components/DesktopNav";
import { useSettings } from "@/hooks/useSettings";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { applyThemeColor } from "@/lib/theme-colors";
import { useTheme } from "next-themes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { theme } = useTheme();

  // Initialize Realtime subscriptions
  // This hook handles subscribe/unsubscribe based on auth state
  // The hook manages its own lifecycle internally
  useRealtimeSync();

  // Apply accent color when settings or theme changes
  useEffect(() => {
    if (settings?.accentColor) {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      applyThemeColor(settings.accentColor, isDark);
    }
  }, [settings?.accentColor, theme]);

  const navigation = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("transactions"), href: "/transactions", icon: Receipt },
    { name: t("recurring"), href: "/recurring", icon: Repeat },
    { name: t("categories"), href: "/categories", icon: Tags },
    { name: t("contexts"), href: "/contexts", icon: Layers },
    { name: t("groups"), href: "/groups", icon: Users },
    { name: t("statistics"), href: "/statistics", icon: PieChart },
    { name: t("settings"), href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-dvh flex-col md:flex-row bg-background overscroll-none overflow-hidden">
      <MobileNav navigation={navigation} />
      <DesktopNav navigation={navigation} />

      {/* Main Content - pt accounts for fixed mobile header + safe area top, pb for iOS safe area bottom */}
      <main className="main-content-safe flex-1 w-full overflow-y-auto overscroll-contain p-4 md:p-8 md:pt-8 md:pb-8">
        <div className="mx-auto max-w-6xl space-y-6 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
      </main>
    </div>
  );
}
