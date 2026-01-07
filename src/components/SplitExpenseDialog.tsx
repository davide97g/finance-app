import revolutLogo from "@/assets/revolut.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMobile } from "@/hooks/useMobile";
import { useSettings } from "@/hooks/useSettings";
import { generateRevolutLinks } from "@/lib/revolutUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Smartphone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const splitExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  totalAmount: z.number().positive("Amount must be greater than 0"),
  numberOfPeople: z.number().int().min(1, "At least 1 person is required"),
});

type SplitExpenseFormValues = z.infer<typeof splitExpenseSchema>;

interface SplitExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    description?: string;
    amount?: number;
  } | null;
}

export const SplitExpenseDialog = ({
  open,
  onOpenChange,
  initialData,
}: SplitExpenseDialogProps) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const isMobile = useMobile();
  const navigate = useNavigate();

  // Get Revolut username from settings, no fallback
  const revolutUsername = settings?.revolut_username;

  const [copied, setCopied] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<{
    web: string;
    app: string;
  } | null>(null);
  const [linkType, setLinkType] = useState<"web" | "app">(
    isMobile ? "app" : "web"
  );

  const form = useForm<SplitExpenseFormValues>({
    resolver: zodResolver(splitExpenseSchema),
    defaultValues: {
      description: initialData?.description || "",
      totalAmount: initialData?.amount || 0,
      numberOfPeople: 2,
    },
  });

  const totalAmount = form.watch("totalAmount");
  const numberOfPeople = form.watch("numberOfPeople");
  const description = form.watch("description");

  // Update link type preference when mobile state changes
  useEffect(() => {
    setLinkType(isMobile ? "app" : "web");
  }, [isMobile]);

  // Generate payment links when values change
  useEffect(() => {
    if (
      revolutUsername &&
      revolutUsername.trim() !== "" &&
      totalAmount > 0 &&
      numberOfPeople > 0 &&
      description &&
      description.trim() !== ""
    ) {
      try {
        // Generate both web and app links with total amount (not divided)
        const links = generateRevolutLinks(
          revolutUsername,
          totalAmount,
          description
        );
        setPaymentLinks(links);
      } catch (_error) {
        setPaymentLinks(null);
      }
    } else {
      setPaymentLinks(null);
    }
  }, [totalAmount, numberOfPeople, description, revolutUsername]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Check if Revolut username is configured
      if (!revolutUsername || revolutUsername.trim() === "") {
        onOpenChange(false);
        toast.error(
          t("revolut_username_required") ||
            "Revolut username is required. Please configure it in Settings."
        );
        navigate("/settings?tab=advanced");
      } else {
        form.reset({
          description: initialData?.description || "",
          totalAmount: initialData?.amount || 0,
          numberOfPeople: 2,
        });
        setLinkType(isMobile ? "app" : "web");
      }
    } else {
      setCopied(false);
      setPaymentLinks(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, isMobile, revolutUsername, navigate, onOpenChange, t]);

  const currentLink = paymentLinks ? paymentLinks[linkType] : null;

  const handleCopyLink = async () => {
    if (!currentLink) return;
    try {
      await navigator.clipboard.writeText(currentLink);
      setCopied(true);
      toast.success(t("link_copied") || "Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error(t("copy_failed") || "Failed to copy link");
    }
  };

  const handleOpenLink = () => {
    if (!currentLink) return;

    if (linkType === "app") {
      // Try to open app link, fallback to web if it fails
      window.location.href = currentLink;
      // Fallback to web after a short delay if app doesn't open
      setTimeout(() => {
        if (paymentLinks?.web) {
          window.open(paymentLinks.web, "_blank");
        }
      }, 500);
    } else {
      window.open(currentLink, "_blank");
    }
  };

  const handleSubmit = async (_data: SplitExpenseFormValues) => {
    // Form validation is handled by zod
    // The links are already generated and displayed
    // User can copy/share them
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100%-2rem)] sm:max-w-[600px]">
        <DialogHeader className="px-0 sm:px-0">
          <DialogTitle className="pr-8">
            {t("split_expense") || "Split Expense"}
          </DialogTitle>
          <DialogDescription className="pr-0">
            {t("split_expense_description") ||
              "Divide an expense and generate Revolut payment links for each person"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 -mx-1 px-1 sm:mx-0 sm:px-0"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("expense_description_placeholder") ||
                        "e.g., Airbnb Marbella"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("total_amount") || "Total Amount"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("number_of_people") || "Number of People"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="2"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        field.onChange(value);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentLinks && (
              <div className="space-y-4 pt-4 border-t w-full">
                {/* Payment Summary */}
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gradient-to-br from-[#0075EB] via-[#00D4FF] to-[#5B4FFF] text-white w-full overflow-hidden">
                  <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                    <div className="text-xs sm:text-sm opacity-90 truncate">
                      {t("total_amount") || "Total Amount"}
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                      €{totalAmount.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm opacity-80">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">
                        {numberOfPeople}{" "}
                        {numberOfPeople === 1
                          ? t("person") || "Person"
                          : t("people") || "People"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm shrink-0 ml-2 sm:ml-4">
                    <img
                      src={revolutLogo}
                      alt="Revolut"
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 object-contain"
                    />
                  </div>
                </div>

                {/* Payment Link Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-[#0075EB]/20 bg-gradient-to-br from-white to-[#0075EB]/5 dark:from-gray-900 dark:to-[#0075EB]/10 p-3 sm:p-4 md:p-6 shadow-lg w-full">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0075EB]/10 via-transparent to-[#5B4FFF]/10 pointer-events-none" />

                  <div className="relative space-y-3 sm:space-y-4 w-full">
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={revolutLogo}
                          alt="Revolut"
                          className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain shrink-0"
                        />
                        <Label className="text-xs sm:text-sm md:text-base font-semibold truncate">
                          {t("revolut_payment_link") || "Revolut Payment Link"}
                        </Label>
                      </div>
                    </div>

                    {/* Link Type Toggle */}
                    <Tabs
                      value={linkType}
                      onValueChange={(value) =>
                        setLinkType(value as "web" | "app")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-auto">
                        <TabsTrigger
                          value="web"
                          className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
                        >
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{t("web") || "Web"}</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="app"
                          className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
                        >
                          <Smartphone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{t("app") || "App"}</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent
                        value="web"
                        className="mt-3 sm:mt-4 space-y-2 w-full"
                      >
                        <div className="text-xs text-muted-foreground mb-2 break-words">
                          {t("web_link_description") ||
                            "Share this web link. Opens in browser."}
                        </div>

                        <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-background/50 border border-[#0075EB]/20 backdrop-blur-sm w-full overflow-hidden">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="text-[10px] sm:text-xs font-mono text-foreground/80 break-all break-words">
                              {paymentLinks.web}
                            </div>
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-[#0075EB]/10 shrink-0"
                              onClick={handleCopyLink}
                              title={t("copy_link") || "Copy link"}
                            >
                              {copied && linkType === "web" ? (
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-[#0075EB]/10 shrink-0"
                              onClick={handleOpenLink}
                              title={t("open_link") || "Open link"}
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="app"
                        className="mt-3 sm:mt-4 space-y-2 w-full"
                      >
                        <div className="text-xs text-muted-foreground mb-2 break-words">
                          {t("app_link_description") ||
                            "Share this app link. Opens Revolut app if installed."}
                        </div>

                        <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-background/50 border border-[#0075EB]/20 backdrop-blur-sm w-full overflow-hidden">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="text-[10px] sm:text-xs font-mono text-foreground/80 break-all break-words">
                              {paymentLinks.app}
                            </div>
                          </div>
                          <div className="flex gap-0.5 sm:gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-[#0075EB]/10 shrink-0"
                              onClick={handleCopyLink}
                              title={t("copy_link") || "Copy link"}
                            >
                              {copied && linkType === "app" ? (
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-[#0075EB]/10 shrink-0"
                              onClick={handleOpenLink}
                              title={t("open_link") || "Open link"}
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2 w-full">
                      <Button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex-1 w-full bg-gradient-to-r from-[#0075EB] to-[#5B4FFF] hover:from-[#0066CC] hover:to-[#4A3FDD] text-white border-0 text-sm sm:text-base"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
                            <span className="truncate">
                              {t("copied") || "Copied!"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
                            <span className="truncate">
                              {t("copy_link") || "Copy Link"}
                            </span>
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenLink}
                        className="flex-1 w-full border-[#0075EB]/30 hover:bg-[#0075EB]/10 text-sm sm:text-base"
                      >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {t("open_in_revolut") || "Open in Revolut"}
                        </span>
                        <span className="sm:hidden truncate">
                          {t("open") || "Open"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="px-0 sm:px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t("close") || "Close"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
