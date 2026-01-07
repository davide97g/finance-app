import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getCroppedImageBlob } from "@/lib/imageUtils";
import { toast } from "sonner";
import i18n from "@/i18n";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (blob: Blob) => Promise<void>;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      toast.error(
        i18n.t("crop_error_no_area", {
          defaultValue: "Please adjust the crop area",
        })
      );
      return;
    }

    setProcessing(true);

    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      await onCropComplete(blob);
      onOpenChange(false);
      
      // Reset state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error("[ImageCrop] Error processing image:", error);
      toast.error(
        i18n.t("crop_error_processing", {
          defaultValue: "Failed to process image. Please try again.",
        })
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {t("crop_dialog_title", { defaultValue: "Crop Profile Picture" })}
          </DialogTitle>
        </DialogHeader>

        <div className="relative w-full" style={{ height: "400px" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                position: "relative",
              },
            }}
          />
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("crop_zoom_label", { defaultValue: "Zoom" })}
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              aria-label={t("crop_zoom_label", { defaultValue: "Zoom" })}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("crop_zoom_min", { defaultValue: "1x" })}</span>
              <span>{t("crop_zoom_max", { defaultValue: "3x" })}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("crop_hint", {
              defaultValue:
                "Drag to reposition, use zoom to adjust. The image will be cropped to a circle.",
            })}
          </p>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={processing}
          >
            {t("cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing", { defaultValue: "Processing..." })}
              </>
            ) : (
              t("save", { defaultValue: "Save" })
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

