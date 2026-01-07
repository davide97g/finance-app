import { HelpSystemWrapper } from "@/components/help/HelpSystem";
import { ImportWizard } from "@/components/import/ImportWizard";
import { ImportRulesManager } from "@/components/settings/ImportRulesManager";
import { SyncIndicator } from "@/components/SyncStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContentLoader } from "@/components/ui/content-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthProvider";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { useProfile } from "@/hooks/useProfiles";
import { useSettings } from "@/hooks/useSettings";
import { useWelcomeWizard } from "@/hooks/useWelcomeWizard";
import { UNCATEGORIZED_CATEGORY } from "@/lib/constants";
import { db } from "@/lib/db";
import { validatePartnerId } from "@/lib/jointAccount";
import { safeSync, syncManager } from "@/lib/sync";
import { THEME_COLORS } from "@/lib/theme-colors";
import { cn, getLocalDate } from "@/lib/utils";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Compass,
  Database,
  Download,
  Link2,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// Helper component for displaying linked joint account
const JointAccountLinked = ({
  partnerId,
  onUnlink,
}: {
  partnerId: string;
  onUnlink: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const partnerProfile = useProfile(partnerId);
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await onUnlink();
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {partnerProfile?.full_name ||
                partnerProfile?.email ||
                partnerId.slice(0, 8) + "..."}
            </p>
            {partnerProfile?.email && (
              <p className="text-xs text-muted-foreground truncate">
                {partnerProfile.email}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnlink}
          disabled={unlinking}
          className="shrink-0"
        >
          {unlinking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <X className="h-4 w-4 mr-1" />
              {t("unlink") || "Unlink"}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("joint_account_linked_note") ||
          "Your accounts are linked. All transactions, categories, and contexts are shared in real-time."}
      </p>
    </div>
  );
};

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { isOnline } = useOnlineSync();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();
  const [manualSyncing, setManualSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("appearance");
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [validatingPartner, setValidatingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  // Welcome wizard hook for "Review Tutorial" button
  const welcomeWizard = useWelcomeWizard();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle URL param for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["appearance", "data", "advanced"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const isSyncing = manualSyncing || fullSyncing;

  const handleManualSync = async () => {
    setManualSyncing(true);
    await safeSync("handleManualSync");
    setLastSyncTime(new Date());
    setManualSyncing(false);
  };

  const handleFullSync = async () => {
    setFullSyncing(true);
    try {
      await syncManager.fullSync();
      setLastSyncTime(new Date());
      toast.success(t("full_sync_completed") || "Full sync completed!");
    } catch (_error) {
      toast.error(t("sync_error") || "Sync failed");
    } finally {
      setFullSyncing(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      await db.delete();
      await db.open();
      toast.success(t("cache_cleared"));
      await safeSync("handleClearCache");
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error(t("cache_clear_error") || "Failed to clear cache.");
    }
    setClearingCache(false);
  };

  const handleImportComplete = async (stats?: {
    transactions: number;
    categories: number;
  }) => {
    await safeSync("handleImportComplete");
    toast.success(
      t("import_success", {
        transactions: stats?.transactions || 0,
        categories: stats?.categories || 0,
      }) || "Import successful"
    );
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      const transactions = await db.transactions
        .filter((t) => t.user_id === user.id && !t.deleted_at)
        .toArray();
      const categories = await db.categories
        .filter(
          (c) =>
            c.user_id === user.id &&
            !c.deleted_at &&
            c.id !== UNCATEGORIZED_CATEGORY.ID
        )
        .toArray();
      const contexts = await db.contexts
        .filter((c) => c.user_id === user.id && !c.deleted_at)
        .toArray();
      const recurring = await db.recurring_transactions
        .filter((r) => r.user_id === user.id && !r.deleted_at)
        .toArray();
      const budgets = await db.category_budgets
        .filter((b) => b.user_id === user.id && !b.deleted_at)
        .toArray();
      const groups = await db.groups
        .filter((g) => !g.deleted_at) // Groups might not have user_id directly if I'm just a member, but created_by is there.
        // Actually, for a backup, ideally we want groups I'm a member of.
        // But simply filtering by created_by might miss groups where I am a guest/member.
        // However, checking membership for every group is expensive.
        // For now, let's export ALL local groups since this is a local-first app and I only have groups I'm involved in locally?
        // Let's verify db.ts.
        // Sync pulls groups I'm in. So local DB should only have relevant groups.
        .toArray();
      const groupMembers = await db.group_members
        .filter((m) => !m.removed_at)
        .toArray();

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        transactions: transactions.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        categories: categories.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        contexts: contexts.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        recurring_transactions: recurring.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        category_budgets: budgets.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        groups: groups.map(
          ({ pendingSync: _pendingSync, deleted_at: _deleted_at, ...rest }) =>
            rest
        ),
        group_members: groupMembers.map(
          ({ pendingSync: _pendingSync, removed_at: _removed_at, ...rest }) =>
            rest
        ),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-tracker-export-${getLocalDate()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        t("export_success") ||
          `Exported ${transactions.length} tx, ${categories.length} cat, ${recurring.length} recurring`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(t("export_error") || `Export failed: ${message}`);
    } finally {
      setExportingData(false);
    }
  };

  const handleThemeChange = (theme: string) => {
    updateSettings({ theme });
    setTheme(theme);
  };

  if (!settings) {
    return (
      <div className="space-y-6 pb-10">
        <ContentLoader variant="card" count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{t("settings")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("settings_general_desc")}
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 h-13 dark:bg-primary/20">
          <TabsTrigger value="appearance" className="gap-2 text-xs sm:text-sm">
            <Palette className="h-4 w-4 hidden sm:block" />
            {t("tab_appearance")}
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 text-xs sm:text-sm">
            <Database className="h-4 w-4 hidden sm:block" />
            {t("tab_data")}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2 text-xs sm:text-sm">
            <Wrench className="h-4 w-4 hidden sm:block" />
            {t("tab_advanced")}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Appearance */}
        <TabsContent value="appearance" className="space-y-4 animate-fade-in">
          {/* Language */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("language")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={settings.language || "en"}
                onValueChange={(value) => {
                  updateSettings({ language: value });
                  import("@/i18n").then(({ default: i18n }) => {
                    i18n.changeLanguage(value);
                  });
                }}
              >
                <SelectTrigger className="w-full h-12 touch-manipulation">
                  <SelectValue placeholder={t("select_language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language_en")}</SelectItem>
                  <SelectItem value="it">{t("language_it")}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Theme Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("theme")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[
                  { value: "light", icon: Sun, label: t("light") },
                  { value: "dark", icon: Moon, label: t("dark") },
                  { value: "system", icon: Monitor, label: t("system") },
                ].map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    variant={settings.theme === value ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12 gap-2 transition-all touch-manipulation",
                      settings.theme === value &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => handleThemeChange(value)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accent Color Palette */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("accent_color")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {Object.values(THEME_COLORS).map((color) => {
                  const isSelected =
                    (settings.accentColor || "slate") === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() =>
                        updateSettings({ accentColor: color.name })
                      }
                      className={cn(
                        "relative h-8 w-full rounded-md border-2 transition-all touch-manipulation hover:scale-105 active:scale-95",
                        isSelected
                          ? "border-foreground ring-2 ring-offset-1 ring-foreground"
                          : "border-transparent hover:border-muted-foreground/50"
                      )}
                      style={{
                        backgroundColor: `hsl(${
                          mounted && resolvedTheme === "dark"
                            ? color.dark.primary
                            : color.light.primary
                        })`,
                      }}
                      title={t(color.name)}
                    >
                      {isSelected && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {t(settings.accentColor || "slate")}
              </p>
            </CardContent>
          </Card>

          {/* Review Tutorial */}
          {/* Help & Resources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("help_and_resources", "Help & Resources")}
              </CardTitle>
              <CardDescription>
                {t(
                  "help_resources_desc",
                  "Learn how to use the app to its full potential."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <HelpSystemWrapper triggerAsChild>
                <Button
                  variant="outline"
                  className="w-full h-12 gap-3 touch-manipulation justify-start"
                >
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-sm">
                      {t("open_user_guide", "Open User Guide")}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {t("user_guide_desc", "Documentation, gestures & tips")}
                    </span>
                  </div>
                </Button>
              </HelpSystemWrapper>

              <Button
                variant="outline"
                className="w-full h-12 gap-3 touch-manipulation justify-start"
                onClick={() => welcomeWizard.reset()}
              >
                <Compass className="h-5 w-5 text-primary" />
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-medium text-sm">
                    {t("welcome.review_tutorial")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {t("welcome.review_tutorial_desc")}
                  </span>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Data */}
        <TabsContent value="data" className="space-y-4 animate-fade-in">
          {/* Monthly Budget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("monthly_budget")}</CardTitle>
              <CardDescription>{t("monthly_budget_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <span className="text-lg font-medium text-muted-foreground">
                  €
                </span>
                <Input
                  key={settings.monthly_budget ?? "empty"}
                  type="number"
                  step="1"
                  min="0"
                  placeholder={t("budget_placeholder")}
                  defaultValue={settings.monthly_budget ?? ""}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value && parseFloat(value) < 0) {
                      e.target.value = "";
                      updateSettings({ monthly_budget: null });
                      return;
                    }
                    updateSettings({
                      monthly_budget: value ? parseFloat(value) : null,
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                  }}
                  className="flex-1 h-12 touch-manipulation text-lg"
                />
                {settings.monthly_budget !== null &&
                  settings.monthly_budget !== undefined && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      onClick={() => updateSettings({ monthly_budget: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {settings.monthly_budget
                  ? `€${settings.monthly_budget.toFixed(2)} / ${t(
                      "monthly"
                    ).toLowerCase()}`
                  : t("budget_not_set")}
              </p>
            </CardContent>
          </Card>

          {/* Export & Import */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("data_management")}
              </CardTitle>
              <CardDescription>{t("data_management_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Export */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start gap-3 touch-manipulation"
                    disabled={exportingData}
                  >
                    {exportingData ? (
                      <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 shrink-0 text-primary" />
                    )}
                    <div className="text-left overflow-hidden min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {t("export_data")}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t("export_data_desc")}
                      </div>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      {t("export_confirm_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-left">
                      {t("export_confirm_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExportData}>
                      {t("export_data")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Import */}
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3 touch-manipulation"
                onClick={() => setIsImportWizardOpen(true)}
              >
                <Upload className="h-5 w-5 shrink-0 text-primary" />
                <div className="text-left overflow-hidden min-w-0 flex-1">
                  <div className="font-medium truncate">{t("import_data")}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t("import_data_desc")}
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <ImportRulesManager />
        </TabsContent>

        {/* Tab: Advanced */}
        <TabsContent value="advanced" className="space-y-4 animate-fade-in">
          {/* Input Optimizations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("input_optimizations", "Ottimizzazioni inserimento")}
              </CardTitle>
              <CardDescription>
                {t(
                  "input_optimizations_desc",
                  "Personalizza l'ordine delle categorie durante l'inserimento delle transazioni"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Category Sorting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="category-sorting-enabled">
                    {t(
                      "enable_category_sorting",
                      "Ordina categorie per utilizzo"
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "enable_category_sorting_desc",
                      "Le categorie di spesa più utilizzate appariranno per prime"
                    )}
                  </p>
                </div>
                <Switch
                  id="category-sorting-enabled"
                  checked={settings.category_sorting_enabled || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ category_sorting_enabled: checked })
                  }
                />
              </div>

              {/* Sorting Strategy */}
              {settings.category_sorting_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sorting-strategy">
                      {t("sorting_strategy", "Strategia di ordinamento")}
                    </Label>
                    <Select
                      value={
                        settings.category_sorting_strategy || "moving_average"
                      }
                      onValueChange={(
                        value:
                          | "moving_average"
                          | "total_all_time"
                          | "recent_order"
                      ) => updateSettings({ category_sorting_strategy: value })}
                    >
                      <SelectTrigger
                        id="sorting-strategy"
                        className="h-12 touch-manipulation"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moving_average">
                          {t(
                            "strategy_moving_average",
                            "Media mobile (ultimi N giorni)"
                          )}
                        </SelectItem>
                        <SelectItem value="total_all_time">
                          {t("strategy_total_all_time", "Totale di sempre")}
                        </SelectItem>
                        <SelectItem value="recent_order">
                          {t("strategy_recent_order", "Ultime utilizzate")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Moving Average Days */}
                  {settings.category_sorting_strategy === "moving_average" && (
                    <div className="space-y-2">
                      <Label htmlFor="sorting-days">
                        {t("moving_average_days", "Numero di giorni")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="sorting-days"
                          type="number"
                          min="7"
                          max="365"
                          value={settings.category_sorting_days || 30}
                          onChange={(e) => {
                            const days = parseInt(e.target.value, 10);
                            if (!isNaN(days) && days >= 7 && days <= 365) {
                              updateSettings({ category_sorting_days: days });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === "e") {
                              e.preventDefault();
                            }
                          }}
                          className="flex-1 h-12 touch-manipulation"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {t("days", "giorni")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "moving_average_days_desc",
                          "Conta le transazioni degli ultimi N giorni (7 o 30 consigliati)"
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* User Mode */}
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="user-mode">
                  {t("user_mode", "Modalità utente")}
                </Label>
                <Select
                  value={settings.user_mode || "default"}
                  onValueChange={(
                    value: "default" | "simplified" | "advanced"
                  ) => updateSettings({ user_mode: value })}
                >
                  <SelectTrigger
                    id="user-mode"
                    className="h-12 touch-manipulation"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      {t("mode_default", "Predefinita")}
                    </SelectItem>
                    <SelectItem value="simplified">
                      {t("mode_simplified", "Semplificata")}
                    </SelectItem>
                    <SelectItem value="advanced">
                      {t("mode_advanced", "Avanzata")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "user_mode_desc",
                    "Modalità per future personalizzazioni dell'app"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Revolut Username */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("revolut_username") || "Revolut Username"}
              </CardTitle>
              <CardDescription>
                {t("revolut_username_desc") ||
                  "Your Revolut username for generating payment links"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  value={settings.revolut_username || ""}
                  onChange={(e) => {
                    updateSettings({
                      revolut_username: e.target.value || null,
                    });
                  }}
                  className="h-12 touch-manipulation"
                  placeholder={
                    t("revolut_username_placeholder") ||
                    "Enter your Revolut username"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("revolut_username_note") ||
                    "Enter your Revolut username to generate payment links when splitting expenses"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Joint Account */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("joint_account") || "Joint Account"}
              </CardTitle>
              <CardDescription>
                {t("joint_account_desc") ||
                  "Link your account with a partner to share all transactions, categories, and contexts in real-time"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.joint_account_partner_id ? (
                <JointAccountLinked
                  partnerId={settings.joint_account_partner_id}
                  onUnlink={async () => {
                    await updateSettings({
                      joint_account_partner_id: null,
                    });
                    setPartnerIdInput("");
                    setPartnerError(null);
                    toast.success(
                      t("joint_account_unlinked") ||
                        "Joint account unlinked successfully"
                    );
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="partner-id">
                    {t("partner_user_id") || "Partner User ID"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="partner-id"
                      value={partnerIdInput}
                      onChange={(e) => {
                        setPartnerIdInput(e.target.value.trim());
                        setPartnerError(null);
                      }}
                      className="h-12 touch-manipulation flex-1"
                      placeholder={
                        t("partner_user_id_placeholder") ||
                        "Enter partner's user ID (UUID)"
                      }
                      disabled={validatingPartner}
                    />
                    <Button
                      onClick={async () => {
                        if (!user) return;
                        if (!partnerIdInput.trim()) {
                          setPartnerError(
                            t("partner_id_required") ||
                              "Please enter a partner user ID"
                          );
                          return;
                        }

                        setValidatingPartner(true);
                        setPartnerError(null);

                        const validation = await validatePartnerId(
                          partnerIdInput.trim(),
                          user.id
                        );

                        if (!validation.valid) {
                          setPartnerError(
                            validation.error || "Invalid partner"
                          );
                          setValidatingPartner(false);
                          return;
                        }

                        try {
                          await updateSettings({
                            joint_account_partner_id: partnerIdInput.trim(),
                          });
                          setPartnerIdInput("");
                          toast.success(
                            t("joint_account_linked") ||
                              "Joint account linked successfully! Both accounts will now share data."
                          );
                          // Trigger a sync to fetch partner's data
                          await safeSync("jointAccountLinked");
                        } catch (error) {
                          console.error(
                            "[Settings] Failed to link joint account:",
                            error
                          );
                          setPartnerError(
                            t("joint_account_link_error") ||
                              "Failed to link joint account. Please try again."
                          );
                        } finally {
                          setValidatingPartner(false);
                        }
                      }}
                      disabled={validatingPartner || !partnerIdInput.trim()}
                      className="h-12 touch-manipulation"
                    >
                      {validatingPartner ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2" />
                      )}
                      {t("link_account") || "Link Account"}
                    </Button>
                  </div>
                  {partnerError && (
                    <p className="text-xs text-destructive">{partnerError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("joint_account_note") ||
                      "Enter your partner's user ID to link accounts. Both accounts will share all transactions, categories, and contexts. Real-time updates will sync automatically."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("sync")}</CardTitle>
              <CardDescription>{t("sync_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SyncIndicator
                isSyncing={isSyncing}
                isOnline={isOnline}
                lastSyncTime={lastSyncTime}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing || !isOnline}
                  variant="outline"
                  className="h-12 touch-manipulation"
                >
                  <RefreshCw
                    className={cn(
                      "mr-2 h-4 w-4",
                      manualSyncing && "animate-spin"
                    )}
                  />
                  {t("sync_now")}
                </Button>
                <Button
                  onClick={handleFullSync}
                  disabled={isSyncing || !isOnline}
                  variant="secondary"
                  className="h-12 touch-manipulation"
                  title={
                    t("full_sync_desc") || "Re-download all data from server"
                  }
                >
                  <RefreshCw
                    className={cn(
                      "mr-2 h-4 w-4",
                      fullSyncing && "animate-spin"
                    )}
                  />
                  {t("full_sync")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("full_sync_hint")}
              </p>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("danger_zone")}
              </CardTitle>
              <CardDescription>{t("danger_zone_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full h-12 touch-manipulation"
                    disabled={clearingCache}
                  >
                    {clearingCache ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {t("clear_local_cache")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      {t("clear_cache_confirm_title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("clear_cache_confirm_desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearCache}
                      className="bg-destructive text-destructive-foreground"
                    >
                      {t("clear")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground mt-2">
                {t("clear_local_cache_desc")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
