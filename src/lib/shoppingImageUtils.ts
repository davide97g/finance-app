/**
 * Image compression utilities for shopping item images
 * Optimized to preserve text and small details while minimizing file size
 */

const MAX_DIMENSION = 1920; // Max width or height in pixels
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit
const INITIAL_QUALITY = 0.9; // Start with high quality to preserve details
const MIN_QUALITY = 0.6; // Minimum quality before giving up
const QUALITY_STEP = 0.05; // Reduce quality by 5% each iteration

/**
 * Resizes an image to fit within max dimensions while maintaining aspect ratio
 */
const resizeImage = (
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement => {
  let { width, height } = image;

  // Calculate new dimensions maintaining aspect ratio
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use high-quality image rendering to preserve details
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, 0, 0, width, height);

  return canvas;
};

/**
 * Compresses an image by reducing quality until it meets the file size limit
 * Uses WebP format for optimal compression while preserving details
 */
const compressImage = async (
  canvas: HTMLCanvasElement,
  quality: number = INITIAL_QUALITY
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const tryCompress = (currentQuality: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          // If we meet the size limit or hit minimum quality, return
          if (blob.size <= MAX_FILE_SIZE || currentQuality <= MIN_QUALITY) {
            resolve(blob);
          } else {
            // Reduce quality and try again
            const newQuality = Math.max(MIN_QUALITY, currentQuality - QUALITY_STEP);
            tryCompress(newQuality);
          }
        },
        "image/webp", // Use WebP for better compression
        currentQuality
      );
    };

    tryCompress(quality);
  });
};

/**
 * Main function to compress shopping item images
 * Converts to WebP, resizes if needed, and compresses to meet file size limit
 * while preserving text and small details
 */
export const compressShoppingItemImage = async (
  file: File
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    const objectUrl = URL.createObjectURL(file);

    image.onload = async () => {
      try {
        // Step 1: Resize if needed (maintains aspect ratio)
        const canvas = resizeImage(image, MAX_DIMENSION, MAX_DIMENSION);

        // Step 2: Compress to meet file size limit
        // Start with high quality (0.9) to preserve text and details
        const blob = await compressImage(canvas, INITIAL_QUALITY);

        // Clean up object URL
        URL.revokeObjectURL(objectUrl);

        resolve(blob);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    image.src = objectUrl;
  });
};

/**
 * Validates that a file is an image
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  return validTypes.includes(file.type);
};

/**
 * Gets the file size in a human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

