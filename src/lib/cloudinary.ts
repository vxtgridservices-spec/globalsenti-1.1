/**
 * Cloudinary Image Optimization Utility
 * 
 * This utility helps in transforming Cloudinary URLs to include optimization parameters
 * such as automatic format (f_auto) and automatic quality (q_auto).
 */

export function getOptimizedImageUrl(url: string, options: { width?: number; height?: number; crop?: string } = {}) {
  if (!url) return '';
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  
  // If no cloud name is provided, return original URL
  if (!cloudName) return url;

  // Check if it's already a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const { width, height, crop = 'fill' } = options;
      let transformations = 'f_auto,q_auto';
      
      if (width) transformations += `,w_${width}`;
      if (height) transformations += `,h_${height}`;
      if (width || height) transformations += `,c_${crop}`;
      
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    }
  }

  // If it's a standard URL (like Unsplash or Imgur) and you want to proxy it through Cloudinary
  // Note: This requires "Fetched URL" to be enabled in Cloudinary settings.
  // return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${options.width || 'auto'}/${url}`;

  return url;
}
