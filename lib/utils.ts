import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { v4 as uuidv4 } from "uuid";
import { PexelsAPIImage, PexelsImageSize, PexelsAPIVideo } from "./types";

/**
 * Calculate dimensions for a Pexels image based on selected size
 *
 * @param asset The Pexels image
 * @param sizeType The size variant
 * @returns Object with calculated width and height
 */
export function calculateImageDimensions(
  asset: PexelsAPIImage,
  sizeType: PexelsImageSize = "original"
): { width: number; height: number } {
  // For original size, use original dimensions
  if (sizeType === "original") {
    return {
      width: asset.width,
      height: asset.height,
    };
  }

  const aspectRatio = asset.width / asset.height;

  switch (sizeType) {
    case "large2x":
      // The image resized W 940px X H 650px DPR 2
      return {
        width: 1880, // 940 * 2
        height: 1300, // 650 * 2
      };
    case "large":
      // The image resized to W 940px X H 650px DPR 1
      return {
        width: 940,
        height: 650,
      };
    case "medium":
      // The image scaled proportionally so that it's new height is 350px
      return {
        height: 350,
        width: Math.round(350 * aspectRatio),
      };
    case "small":
      // The image scaled proportionally so that it's new height is 130px
      return {
        height: 130,
        width: Math.round(130 * aspectRatio),
      };
    case "portrait":
      // The image cropped to W 800px X H 1200px
      return {
        width: 800,
        height: 1200,
      };
    case "landscape":
      // The image cropped to W 1200px X H 627px
      return {
        width: 1200,
        height: 627,
      };
    case "tiny":
      // The image cropped to W 280px X H 200px
      return {
        width: 280,
        height: 200,
      };
    default:
      // Fallback to original dimensions
      return {
        width: asset.width,
        height: asset.height,
      };
  }
}

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

  // Calculate dimensions based on selected size
  const dimensions = calculateImageDimensions(asset, sizeType);

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
        value: dimensions.width,
      },
      height: {
        type: "number",
        value: dimensions.height,
      },
      custom: {
        type: "object",
        value: {
          selectedSize: sizeType,
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
 * @param qualityPreference Optional quality preference (e.g., "hd", "sd")
 * @param includeAuthorCredits Whether to include author credit information
 * @returns A formatted asset compatible with Uniform's SDK
 */
export function mapVideoToUniformAsset(
  asset: PexelsAPIVideo,
  includeAuthorCredits: boolean = true,
  qualityPreference?: string
): AssetParamValueItem {
  // Get the specified quality video file if provided, otherwise find the best quality
  let videoFile;

  if (qualityPreference) {
    // Try to find the specified quality
    videoFile = asset.video_files.find(
      (file) => file.quality === qualityPreference
    );
  }

  // Fall back to best quality if specified quality not found or not specified
  if (!videoFile) {
    videoFile = asset.video_files.reduce((best, current) => {
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
  }

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
          selectedQuality: videoFile.quality,
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
  // Original dimensions
  const original = calculateImageDimensions(asset, "original");

  // Calculate dimensions for each size
  const large2x = calculateImageDimensions(asset, "large2x");
  const large = calculateImageDimensions(asset, "large");
  const medium = calculateImageDimensions(asset, "medium");
  const small = calculateImageDimensions(asset, "small");
  const portrait = calculateImageDimensions(asset, "portrait");
  const landscape = calculateImageDimensions(asset, "landscape");
  const tiny = calculateImageDimensions(asset, "tiny");

  return {
    original: {
      label: "Original",
      description: `Original size (${original.width}×${original.height})`,
    },
    large2x: {
      label: "Large 2x",
      description: `Large size, doubled (${large2x.width}×${large2x.height})`,
    },
    large: {
      label: "Large",
      description: `Large size - good for full-screen display (${large.width}×${large.height})`,
    },
    medium: {
      label: "Medium",
      description: `Medium size - good for regular display (${medium.width}×${medium.height})`,
    },
    small: {
      label: "Small",
      description: `Small size - good for thumbnails and previews (${small.width}×${small.height})`,
    },
    portrait: {
      label: "Portrait",
      description: `Portrait orientation (${portrait.width}×${portrait.height})`,
    },
    landscape: {
      label: "Landscape",
      description: `Landscape orientation (${landscape.width}×${landscape.height})`,
    },
    tiny: {
      label: "Tiny",
      description: `Tiny size - good for icons and very small previews (${tiny.width}×${tiny.height})`,
    },
  };
}

/**
 * Downloads a Pexels asset (image or video) to the user's device
 *
 * @param asset The Pexels asset (image or video)
 * @param sizeType The size or quality to download (for images)
 * @param videoFileId Optional specific video file ID to download (for videos)
 * @returns Promise resolving when download is complete
 */
export async function downloadAsset(
  asset: PexelsAPIImage | PexelsAPIVideo,
  sizeType: string = "original",
  videoFileId?: number
): Promise<void> {
  try {
    const isVideo = "video_files" in asset;
    let downloadUrl = "";
    let fileName = "";

    if (isVideo) {
      // Find the video file to download
      const videoFiles = (asset as PexelsAPIVideo).video_files;
      let videoFile;

      if (videoFileId) {
        // Try to find the specific video file by ID
        videoFile = videoFiles.find((file) => file.id === videoFileId);
      }

      if (!videoFile) {
        // If no specific file ID provided or not found, find by quality
        videoFile = videoFiles.find((file) => file.quality === sizeType);
      }

      // If still not found, get the highest quality
      if (!videoFile) {
        videoFile = videoFiles.reduce((best, current) => {
          return current.width * current.height > best.width * best.height
            ? current
            : best;
        }, videoFiles[0]);
      }

      // Get the download URL and generate filename
      downloadUrl = videoFile.link;
      fileName = `pexels-video-${asset.id}-${videoFile.quality}.${
        videoFile.file_type.split("/")[1]
      }`;
    } else {
      // For images, use the specified size
      const imageAsset = asset as PexelsAPIImage;
      downloadUrl =
        imageAsset.src[sizeType as PexelsImageSize] || imageAsset.src.original;
      fileName = generateFilename(imageAsset, sizeType as PexelsImageSize);
    }

    // Create a link element to trigger the download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.target = "_blank"; // Open in new tab (helps force download)
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return Promise.resolve();
  } catch (error) {
    console.error("Error downloading asset:", error);
    return Promise.reject(error);
  }
}
