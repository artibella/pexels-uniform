// Pexels API constants
export const PEXELS_API_HOST = "https://api.pexels.com/v1";
export const PEXELS_API_SEARCH_URL = `${PEXELS_API_HOST}/search`;
export const PEXELS_API_PHOTOS_URL = `${PEXELS_API_HOST}/curated`;

// Unsplash API constants (keep for now during migration)
export const UNSPLASH_API_HOST = "https://api.unsplash.com";
export const UNSPLASH_API_SEARCH_URL = `${UNSPLASH_API_HOST}/search/photos`;
export const UNSPLASH_API_PHOTOS_URL = `${UNSPLASH_API_HOST}/photos`;

export const IMAGES_PER_PAGE = 15;
export const DEFAULT_ASSET_SIZE_TYPE = "medium"; // Changed from "regular" to "medium" for Pexels

// Referral query parameter to let Pexels know the source of traffic
export const REFERRAL_QUERY_PARAMS =
  "utm_source=pexels-uniform&utm_medium=referral";

import {
  UnsplashAPIImage,
  UnsplashImageSize,
  PexelsAPIImage,
  PexelsImageSize,
} from "./types";

/**
 * Get human-readable labels and descriptions for Pexels image sizes
 *
 * @param asset The Pexels image to get size labels for
 * @returns An object mapping size keys to label and description
 */
export function getImageSizeLabels(asset: PexelsAPIImage) {
  return {
    original: {
      label: "Original",
      description: `Original size (${asset.width}x${asset.height})`,
    },
    large2x: {
      label: "Large 2x",
      description: "Large size, doubled",
    },
    large: {
      label: "Large",
      description: "Large size - good for full-screen display",
    },
    medium: {
      label: "Medium",
      description: "Medium size - good for regular display",
    },
    small: {
      label: "Small",
      description: "Small size - good for thumbnails and previews",
    },
    portrait: {
      label: "Portrait",
      description: "Portrait orientation (vertical)",
    },
    landscape: {
      label: "Landscape",
      description: "Landscape orientation (horizontal)",
    },
    tiny: {
      label: "Tiny",
      description: "Tiny size - good for icons and very small previews",
    },
  };
}

/**
 * Get image size labels and descriptions for Unsplash images
 * @param asset The Unsplash image to get size labels for
 * @returns A record of image size labels and descriptions
 */
export const getImageSizeLabelsUnsplash = (
  asset: UnsplashAPIImage
): Record<UnsplashImageSize, { label: string; description: string }> => {
  return {
    raw: {
      label: `Raw (${asset.width} × ${asset.height})`,
      description: "Original image without any processing. Largest file size.",
    },
    regular: {
      label: "Regular (1080px)",
      description: "Medium size. Good for most web applications.",
    },
    small: {
      label: "Small (400px)",
      description: "Small size. Good for thumbnails and previews.",
    },
    thumb: {
      label: "Thumbnail (200px)",
      description: "Smallest size. Best for thumbnails and icons.",
    },
    // These options are kept for type compatibility but not shown in the menu
    full: {
      label: `Full (${asset.width} × ${asset.height})`,
      description: "Full resolution image. Best for high-quality printing.",
    },
    small_s3: {
      label: "Small S3",
      description: "Alternative small size hosted on Amazon S3.",
    },
  };
};
