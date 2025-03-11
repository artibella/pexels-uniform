import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { v4 as uuidv4 } from "uuid";
import { PexelsAPIImage, PexelsImageSize, PexelsAPIVideo } from "./types";

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
 * Maps a Pexels API image to the Uniform asset format required by the SDK
 *
 * @param asset The Pexels photo data
 * @param sizeType The preferred size to use for the asset
 * @param includeAuthorCredits Whether to include author credit information
 * @returns A formatted asset compatible with Uniform's SDK
 */
export function mapImageToUniformAsset(
  asset: PexelsAPIImage,
  sizeType: PexelsImageSize = "large",
  includeAuthorCredits: boolean = true
): AssetParamValueItem {
  // Get the selected size URL (or original if not available)
  const imageUrl = asset.src[sizeType] || asset.src.original;

  // Description with optional credits
  let description = asset.alt || "";
  if (includeAuthorCredits) {
    description = `${description} - Photo by ${asset.photographer} on Pexels`;
  }

  // Map to Uniform asset format
  return {
    _id: uuidv4(),
    _source: "pexels-integration",
    type: "image",
    fields: {
      url: {
        type: "text",
        value: imageUrl,
      },
      title: {
        type: "text",
        value: asset.alt || `Photo by ${asset.photographer}`,
      },
      description: {
        type: "text",
        value: description,
      },
      width: {
        type: "number",
        value: asset.width,
      },
      height: {
        type: "number",
        value: asset.height,
      },
      custom: {
        type: "object",
        value: {
          sourceId: asset.id.toString(),
          pexelsUrl: asset.url,
          pexelsOriginalUrl: asset.src.original,
          photoTinyUrl: asset.src.tiny,
          photoSmallUrl: asset.src.small,
          photoMediumUrl: asset.src.medium,
          photoLargeUrl: asset.src.large,
          photoLarge2xUrl: asset.src.large2x,
          photoPortraitUrl: asset.src.portrait,
          photoLandscapeUrl: asset.src.landscape,
          photographer: asset.photographer,
          photographerUrl: asset.photographer_url,
        },
      },
    },
  };
}

/**
 * Maps a Pexels API video to the Uniform asset format required by the SDK
 *
 * @param asset The Pexels video data
 * @param includeAuthorCredits Whether to include author credit information
 * @returns A formatted asset compatible with Uniform's SDK
 */
export function mapVideoToUniformAsset(
  asset: PexelsAPIVideo,
  includeAuthorCredits: boolean = true
): AssetParamValueItem {
  // Get the best quality video file
  const videoFile = asset.video_files.reduce((best, current) => {
    // Prefer HD files with higher resolution
    if (current.quality === "hd" && current.width > best.width) {
      return current;
    }
    // If we don't have an HD file yet, use the largest SD file
    if (best.quality !== "hd" && current.width > best.width) {
      return current;
    }
    return best;
  }, asset.video_files[0]);

  // Get a thumbnail image for the video
  const thumbnailUrl = asset.image;

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Description with optional credits
  let description = "";
  if (includeAuthorCredits) {
    description = `Video by ${asset.user.name} on Pexels`;
  }

  // Map to Uniform asset format
  return {
    _id: uuidv4(),
    _source: "pexels-uniform",
    type: "video",
    fields: {
      url: {
        type: "text",
        value: videoFile.link,
      },
      title: {
        type: "text",
        value: `Video by ${asset.user.name}`,
      },
      description: {
        type: "text",
        value: description,
      },
      width: {
        type: "number",
        value: videoFile.width,
      },
      height: {
        type: "number",
        value: videoFile.height,
      },
      custom: {
        type: "object",
        value: {
          sourceId: asset.id.toString(),
          videoOriginalUrl: asset.url,
          videoThumbnailUrl: thumbnailUrl,
          fileType: videoFile.file_type,
          fps: videoFile.fps,
          quality: videoFile.quality,
          duration: asset.duration,
          durationFormatted: formatDuration(asset.duration),
          authorName: asset.user.name,
          authorProfileUrl: asset.user.url,
        },
      },
    },
  };
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
