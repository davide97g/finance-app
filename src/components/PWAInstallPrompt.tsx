import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    if (deferredPrompt) {
      toast(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="font-medium">
              {t("install_app") || "Install App"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("install_app_desc") ||
              "Install this app on your device for a better experience."}
          </p>
          <div className="flex gap-2 mt-1">
            <Button
              size="sm"
              onClick={async () => {
                if (deferredPrompt) {
                  await deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === "accepted") {
                    setDeferredPrompt(null);
                  }
                }
                toast.dismiss("pwa-install");
              }}
              className="flex-1"
            >
              {t("install") || "Install"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDeferredPrompt(null);
                toast.dismiss("pwa-install");
              }}
              className="flex-1"
            >
              {t("later") || "Later"}
            </Button>
          </div>
        </div>,
        {
          duration: 10000,
          id: "pwa-install",
          position: "bottom-center",
          onDismiss: () => setDeferredPrompt(null),
        }
      );
    }
  }, [deferredPrompt, t]);

  return null;
}
