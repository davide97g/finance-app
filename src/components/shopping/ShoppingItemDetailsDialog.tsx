import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShoppingListItemWithItem, ShoppingListItemImage } from "@/hooks/useShoppingItems";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getShoppingItemImageUrl } from "@/lib/shoppingItemImages";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ShoppingItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listItem: ShoppingListItemWithItem | null;
  onSave: (data: { quantity: number; note: string | null }) => Promise<void>;
  onUploadImage: (file: File) => Promise<ShoppingListItemImage>;
  onDeleteImage: (imageId: string) => Promise<void>;
  isSubmitting?: boolean;
}

interface FormValues {
  quantity: number;
  note: string;
}

export function ShoppingItemDetailsDialog({
  open,
  onOpenChange,
  listItem,
  onSave,
  onUploadImage,
  onDeleteImage,
  isSubmitting = false,
}: ShoppingItemDetailsDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ShoppingListItemImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      quantity: 1,
      note: "",
    },
  });

  // Load images when dialog opens
  useEffect(() => {
    if (open && listItem) {
      form.reset({
        quantity: listItem.quantity || 1,
        note: listItem.note || "",
      });
      loadImages();
    }
  }, [open, listItem, form]);

  const loadImages = async () => {
    if (!listItem) return;

    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from("shopping_list_item_images")
        .select("*")
        .eq("list_item_id", listItem.id)
        .is("deleted_at", null)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Failed to load images:", error);
        setImages([]);
      } else {
        setImages((data as ShoppingListItemImage[]) || []);
      }
    } catch (error) {
      console.error("Error loading images:", error);
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const tempIds = fileArray.map(() => crypto.randomUUID());

    // Add temporary placeholders
    const tempImages: ShoppingListItemImage[] = fileArray.map((_file, index) => ({
      id: tempIds[index],
      list_item_id: listItem?.id || "",
      storage_path: "",
      display_order: images.length + index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setImages((prev) => [...prev, ...tempImages]);
    setUploadingImages(new Set(tempIds));

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const tempId = tempIds[i];

      try {
        const uploadedImage = await onUploadImage(file);
        setImages((prev) =>
          prev.map((img) => (img.id === tempId ? uploadedImage : img))
        );
      } catch (error) {
        console.error("Failed to upload image:", error);
        // Remove failed upload
        setImages((prev) => prev.filter((img) => img.id !== tempId));
      } finally {
        setUploadingImages((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await onDeleteImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success(t("image_deleted") || "Image deleted");
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.delete_image_failed") || "Failed to delete image"
      );
    }
  };

  const handleSubmit = async (data: FormValues) => {
    await onSave({
      quantity: data.quantity,
      note: data.note.trim() || null,
    });
  };

  if (!listItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("edit_item_details") || "Edit Item Details"}</DialogTitle>
          <DialogDescription>
            {t("edit_item_details_desc") ||
              `Edit details for ${listItem.item.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Quantity */}
            <FormField<FormValues, "quantity">
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("quantity") || "Quantity"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value || 1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        field.onChange(isNaN(value) ? 1 : Math.max(1, value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField<FormValues, "note">
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note") || "Note"}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("note_placeholder") || "Add a note..."}
                      {...field}
                      value={field.value || ""}
                      rows={3}
                      maxLength={500}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {(field.value || "").length}/500
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Images Section */}
            <div className="space-y-2">
              <FormLabel>{t("images") || "Images"}</FormLabel>
              <div className="space-y-3">
                {/* Image Grid */}
                {loadingImages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((image) => {
                      const isUploading = uploadingImages.has(image.id);
                      const imageUrl = image.storage_path
                        ? getShoppingItemImageUrl(image.storage_path)
                        : null;

                      return (
                        <div
                          key={image.id}
                          className="relative aspect-square rounded-lg border overflow-hidden bg-muted group"
                        >
                          {isUploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={isUploading}
                            className={cn(
                              "absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-sm z-10",
                              isUploading && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={t("delete_image") || "Delete image"}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                if (!isUploading) {
                                  handleDeleteImage(image.id);
                                }
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t("no_images") || "No images yet"}
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploadingImages.size > 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("upload_images") || "Upload Images"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  {t("image_upload_hint") ||
                    "Upload photos or screenshots (JPEG, PNG, WebP)"}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || uploadingImages.size > 0}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || uploadingImages.size > 0}
              >
                {isSubmitting ? t("saving") || "Saving..." : t("save") || "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

