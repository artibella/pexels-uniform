import { PexelsAPIImage, PexelsImageSize } from "./types";

/**
 * Generates a clean filename for an asset download
 *
 * @param asset The Pexels photo data
 * @param sizeType The size variant being downloaded
 * @returns A cleaned filename string
 */
export function generateFilename(
  asset: PexelsAPIImage,
  sizeType: PexelsImageSize = "medium"
): string {
  // Clean up description and photographer name for filename
  const description = (asset.alt || "photo")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-"); // Replace spaces with hyphens

  const photographer = asset.photographer
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

  // Use sizeType directly in the filename
  const dimensionText = sizeType;

  // Construct the filename with pattern: description-by-photographer-dimension.jpg
  return `${description}-by-${photographer}-${dimensionText}.jpg`;
}

/**
 * Formats a duration in seconds as m:ss
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "0:00";
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

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
