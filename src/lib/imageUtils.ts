import { getOptimizedImageUrl } from './cloudinary';

/**
 * Universal Image Utility
 * Handles:
 * 1. Imgur page-to-direct link conversion
 * 2. Cloudinary auto-optimization (f_auto, q_auto)
 * 3. Fallback defaults
 */

export function getSmartImageUrl(url: string, options: { width?: number; height?: number; crop?: string } = {}) {
  if (!url) return "";

  let processedUrl = url;

  // 1. Handle Imgur conversions (Page -> Direct)
  // Skip if it's already a direct link or an album
  if (url.includes("imgur.com/") && !url.includes("i.imgur.com") && !url.includes("/a/") && !url.includes("/gallery/")) {
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart && !lastPart.includes(".")) {
      processedUrl = `https://i.imgur.com/${lastPart}.jpg`;
    }
  }

  // 2. Apply Cloudinary Optimizations if applicable
  return getOptimizedImageUrl(processedUrl, options);
}
