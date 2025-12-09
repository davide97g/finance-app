import React, { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useOnlineSync } from "@/hooks/useOnlineSync";
import { useAuth } from "@/contexts/AuthProvider";
import { db } from "@/lib/db";
import { safeSync, syncManager } from "@/lib/sync";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SyncIndicator } from "@/components/SyncStatus";
import { ContentLoader } from "@/components/ui/content-loader";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Sun,
  Moon,
  Trash2,
  AlertTriangle,
  Upload,
  Download,
  FileJson,
  Monitor,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { THEME_COLORS } from "@/lib/theme-colors";
import { toast } from "sonner";
import { ImportWizard } from "@/components/import/ImportWizard";

// Removed ImportStats interface as it is now handled within the Wizard/Processor

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { isOnline } = useOnlineSync();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();
  const [manualSyncing, setManualSyncing] = useState(false);
  const [fullSyncing, setFullSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  // New state for Import Wizard
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    } catch (error) {
      toast.error(t("sync_error") || "Sync failed");
    } finally {
      setFullSyncing(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    // Use window.confirm for now as per codebase pattern
    if (window.confirm(t("clear_cache_confirm_desc"))) {
      try {
        await db.delete(); // Clears the entire IndexedDB database
        await db.open(); // Re-opens the database, creating it if it doesn't exist
        toast.success(t("cache_cleared"));
        // Trigger a sync to repopulate from server
        await safeSync("handleClearCache");
      } catch (error) {
        console.error("Failed to clear cache:", error);
        toast.error(t("cache_clear_error") || "Failed to clear cache.");
      }
    }
    setClearingCache(false);
  };

  const handleImportComplete = async () => {
    // Optionally trigger a sync after import here if not done by the processor
    // The processor marks items as pendingSync: 1
    // We can trigger a background sync
    await safeSync("handleImportComplete");
    toast.success(t("import_success") || "Import successful");
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportingData(true);
    try {
      // Fetch all data
      const transactions = await db.transactions
        .filter((t) => t.user_id === user.id && !t.deleted_at)
        .toArray();
      const categories = await db.categories
        .filter((c) => c.user_id === user.id && !c.deleted_at)
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

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        transactions: transactions.map(
          ({ pendingSync, deleted_at, ...rest }) => rest
        ),
        categories: categories.map(
          ({ pendingSync, deleted_at, ...rest }) => rest
        ),
        contexts: contexts.map(({ pendingSync, deleted_at, ...rest }) => rest),
        recurring_transactions: recurring.map(({ pendingSync, deleted_at, ...rest }) => rest),
        category_budgets: budgets.map(({ pendingSync, deleted_at, ...rest }) => rest),
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-tracker-export-${new Date().toISOString().split("T")[0]
        }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        t("export_success") ||
        `Exported ${transactions.length} tx, ${categories.length} cat, ${recurring.length} recurring`
      );
    } catch (error: any) {
      toast.error(t("export_error") || `Export failed: ${error.message}`);
    } finally {
      setExportingData(false);
    }
  };



  if (!settings) {
    return (
      <div className="space-y-6 pb-10">
        <ContentLoader variant="card" count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{t("settings")}</h2>
        <p className="text-muted-foreground">{t("settings_general_desc")}</p>
      </div>
      <div className="grid gap-6">
        {/* 1. General */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings_general")}</CardTitle>
            <CardDescription>{t("settings_general_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="language">{t("language")}</Label>
              <Select
                value={settings.language || "en"}
                onValueChange={(value) => {
                  updateSettings({ language: value });
                  import("@/i18n").then(({ default: i18n }) => {
                    i18n.changeLanguage(value);
                  });
                }}
              >
                <SelectTrigger id="language" className="max-w-[200px]">
                  <SelectValue placeholder={t("select_language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {mounted && resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                )}
                <Label className="text-sm font-medium">
                  {t("theme")} & {t("accent_color")}
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="theme"
                    className="text-xs text-muted-foreground"
                  >
                    {t("theme")}
                  </Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value) => updateSettings({ theme: value })}
                  >
                    <SelectTrigger id="theme" className="h-12 touch-manipulation">
                      <SelectValue placeholder={t("select_theme")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          {t("light")}
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          {t("dark")}
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {t("system")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="accentColor"
                    className="text-xs text-muted-foreground"
                  >
                    {t("accent_color")}
                  </Label>
                  <Select
                    value={settings.accentColor || "slate"}
                    onValueChange={(value) =>
                      updateSettings({ accentColor: value })
                    }
                  >
                    <SelectTrigger id="accentColor" className="h-12 touch-manipulation">
                      <SelectValue placeholder={t("select_accent_color")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(THEME_COLORS).map((color) => (
                        <SelectItem key={color.name} value={color.name}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full border"
                              style={{
                                backgroundColor: `hsl(${color.light.primary})`,
                              }}
                            />
                            {t(color.name)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Monthly Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t("monthly_budget")}
            </CardTitle>
            <CardDescription>{t("monthly_budget_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="monthly-budget">{t("monthly_budget")}</Label>
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground">€</span>
                <Input
                  key={settings.monthly_budget ?? "empty"}
                  id="monthly-budget"
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
                  className="max-w-[200px]"
                />
                {settings.monthly_budget !== null &&
                  settings.monthly_budget !== undefined && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => updateSettings({ monthly_budget: null })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.monthly_budget
                  ? `€${settings.monthly_budget.toFixed(2)} / ${t(
                    "monthly"
                  ).toLowerCase()}`
                  : t("budget_not_set")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Synchronization */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sync")}</CardTitle>
            <CardDescription>{t("sync_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <SyncIndicator
                isSyncing={isSyncing}
                isOnline={isOnline}
                lastSyncTime={lastSyncTime}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing || !isOnline}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${manualSyncing ? "animate-spin" : ""
                      }`}
                  />
                  {t("sync_now")}
                </Button>
                <Button
                  onClick={handleFullSync}
                  disabled={isSyncing || !isOnline}
                  size="sm"
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  title={
                    t("full_sync_desc") || "Re-download all data from server"
                  }
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${fullSyncing ? "animate-spin" : ""
                      }`}
                  />
                  {t("full_sync") || "Full Sync"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("full_sync_hint") ||
                "Use 'Full Sync' if data seems out of sync after direct database changes."}
            </p>
          </CardContent>
        </Card>

        {/* 4. Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>{t("data_management")}</CardTitle>
            <CardDescription>{t("data_management_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clear Local Cache */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  {t("clear_local_cache")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("clear_local_cache_desc")}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={clearingCache}
                    className="w-full sm:w-auto"
                  >
                    {clearingCache ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      t("clear")
                    )}
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
            </div>

            <Separator />

            {/* Export Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  {t("export_data")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("export_data_desc")}
                </p>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={exportingData}
                  className="w-full sm:w-auto"
                >
                  {exportingData ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileJson className="h-4 w-4 mr-2" />
                  )}
                  {t("export_json")}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Import Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  {t("import_data")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("import_data_desc") || "Restore data from a backup or import from other apps."}
                </p>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportWizardOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("import_data")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ImportWizard
        open={isImportWizardOpen}
        onOpenChange={setIsImportWizardOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
