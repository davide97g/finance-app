/**
 * Image processing utilities for profile picture cropping and resizing
 */

import { Area } from "react-easy-crop";

const MIN_DIMENSION = 200;
const MAX_DIMENSION = 2000;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Validates image dimensions are within acceptable range
 */
export const validateImageDimensions = (
  width: number,
  height: number
): boolean => {
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);

  return minDimension >= MIN_DIMENSION && maxDimension <= MAX_DIMENSION;
};

/**
 * Resizes an image to fit within min/max dimensions while maintaining aspect ratio
 */
const resizeImage = (
  image: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  return canvas;
};

/**
 * Crops an image to a circular area
 * cropArea is in image pixel coordinates from react-easy-crop
 * With aspect={1} and cropShape="round", width === height
 */
const cropImageToCircle = (
  image: HTMLImageElement,
  cropArea: Area
): HTMLCanvasElement => {
  const { x, y, width, height } = cropArea;
  // For circular crop with aspect=1, width should equal height
  const size = Math.min(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  // The cropArea from react-easy-crop is already in image pixel coordinates
  // Draw the cropped square portion of the image
  ctx.drawImage(image, x, y, size, size, 0, 0, size, size);

  return canvas;
};

/**
 * Compresses an image by reducing quality until it meets the file size limit
 */
const compressImage = async (
  canvas: HTMLCanvasElement,
  mimeType: string = "image/jpeg",
  quality: number = 0.9
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const tryCompress = (currentQuality: number) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          if (blob.size <= MAX_FILE_SIZE || currentQuality <= 0.1) {
            resolve(blob);
          } else {
            // Reduce quality by 10% and try again
            tryCompress(Math.max(0.1, currentQuality - 0.1));
          }
        },
        mimeType,
        currentQuality
      );
    };

    tryCompress(quality);
  });
};

/**
 * Ensures image dimensions are within acceptable range
 * Returns the target dimensions that fit within min/max while maintaining aspect ratio
 */
const ensureDimensions = (
  width: number,
  height: number
): { width: number; height: number } => {
  let targetWidth = width;
  let targetHeight = height;

  // Ensure minimum dimension
  const minDimension = Math.min(targetWidth, targetHeight);
  if (minDimension < MIN_DIMENSION) {
    const scale = MIN_DIMENSION / minDimension;
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  // Ensure maximum dimension
  const maxDimension = Math.max(targetWidth, targetHeight);
  if (maxDimension > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxDimension;
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  return { width: targetWidth, height: targetHeight };
};

/**
 * Main function to process cropped image
 * Crops to circular area, resizes if needed, and compresses to meet file size limit
 */
export const getCroppedImageBlob = async (
  imageSrc: string,
  cropArea: Area
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = async () => {
      try {
        // Step 1: Crop to circular area
        let croppedCanvas = cropImageToCircle(image, cropArea);

        // Step 2: Ensure dimensions are within acceptable range
        const { width, height } = ensureDimensions(
          croppedCanvas.width,
          croppedCanvas.height
        );

        if (width !== croppedCanvas.width || height !== croppedCanvas.height) {
          // Need to resize
          const tempImage = new Image();
          tempImage.src = croppedCanvas.toDataURL();
          await new Promise((res) => {
            tempImage.onload = res;
          });
          croppedCanvas = resizeImage(tempImage, width, height);
        }

        // Step 3: Validate final dimensions
        if (
          !validateImageDimensions(croppedCanvas.width, croppedCanvas.height)
        ) {
          reject(
            new Error(
              `Image dimensions must be between ${MIN_DIMENSION}x${MIN_DIMENSION} and ${MAX_DIMENSION}x${MAX_DIMENSION}`
            )
          );
          return;
        }

        // Step 4: Compress to meet file size limit
        // Use JPEG for better compression, but try original format first
        const originalMimeType = image.src.startsWith("data:")
          ? image.src.split(";")[0].split(":")[1]
          : "image/jpeg";

        const finalMimeType =
          originalMimeType === "image/png" ? "image/png" : "image/jpeg";

        const blob = await compressImage(croppedCanvas, finalMimeType);

        resolve(blob);
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    image.src = imageSrc;
  });
};
