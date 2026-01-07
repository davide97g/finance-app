/**
 * Utilities for managing shopping item images in Supabase storage
 */

import { deleteRecord, insertRecord } from "./dbOperations";
import {
  compressShoppingItemImage,
  validateImageFile,
} from "./shoppingImageUtils";
import { supabase } from "./supabase";

const SHOPPING_IMAGES_BUCKET = "shopping-item-images";

/**
 * Upload a shopping item image
 * Compresses the image and uploads to Supabase storage
 */
export const uploadShoppingItemImage = async (
  listItemId: string,
  file: File,
  userId: string
): Promise<{ id: string; storagePath: string; publicUrl: string }> => {
  // Validate file type
  if (!validateImageFile(file)) {
    throw new Error(
      "Invalid image file type. Only JPEG, PNG, and WebP are supported."
    );
  }

  // Compress image
  const compressedBlob = await compressShoppingItemImage(file);

  // Generate storage path: {userId}/{listItemId}/{timestamp}-{filename}.webp
  const timestamp = Date.now();
  const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_]/g, "_"); // Sanitize filename
  const storagePath = `${userId}/${listItemId}/${timestamp}-${sanitizedName}.webp`;

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from(SHOPPING_IMAGES_BUCKET)
    .upload(storagePath, compressedBlob, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SHOPPING_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded image");
  }

  // Get existing images to determine display order
  const { data: existingImages } = await supabase
    .from("shopping_list_item_images")
    .select("display_order")
    .eq("list_item_id", listItemId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextDisplayOrder =
    existingImages && existingImages.length > 0
      ? (existingImages[0]?.display_order ?? 0) + 1
      : 0;

  // Create database record
  const imageId = crypto.randomUUID();
  const imageData = {
    id: imageId,
    list_item_id: listItemId,
    storage_path: storagePath,
    display_order: nextDisplayOrder,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await insertRecord("shopping_list_item_images", imageData, userId);

  return {
    id: imageId,
    storagePath,
    publicUrl: urlData.publicUrl,
  };
};

/**
 * Delete a shopping item image
 * Removes from storage and database
 */
export const deleteShoppingItemImage = async (
  imageId: string,
  storagePath: string
): Promise<void> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(SHOPPING_IMAGES_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    console.error("Failed to delete image from storage:", storageError);
    // Continue with database deletion even if storage deletion fails
    // (might already be deleted or not exist)
  }

  // Soft delete from database
  await deleteRecord("shopping_list_item_images", imageId);
};

/**
 * Get public URL for a shopping item image
 */
export const getShoppingItemImageUrl = (storagePath: string): string => {
  const { data } = supabase.storage
    .from(SHOPPING_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return data?.publicUrl || "";
};

/**
 * Delete all images for a shopping list item
 * Used when removing an item from a list
 */
export const deleteAllShoppingItemImages = async (
  listItemId: string,
  _userId: string
): Promise<void> => {
  // Get all images for this list item
  const { data: images, error } = await supabase
    .from("shopping_list_item_images")
    .select("id, storage_path")
    .eq("list_item_id", listItemId)
    .is("deleted_at", null);

  if (error) {
    console.error("Failed to fetch images:", error);
    return;
  }

  if (!images || images.length === 0) {
    return;
  }

  // Delete all images from storage
  const storagePaths = images.map((img) => img.storage_path);
  const { error: storageError } = await supabase.storage
    .from(SHOPPING_IMAGES_BUCKET)
    .remove(storagePaths);

  if (storageError) {
    console.error("Failed to delete images from storage:", storageError);
  }

  // Soft delete all image records
  for (const image of images) {
    await deleteRecord("shopping_list_item_images", image.id);
  }
};
