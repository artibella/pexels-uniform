import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { v4 as uuidv4 } from "uuid";
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
 * Maps a Pexels API image to the Uniform asset format required by the SDK
 *
 * @param asset The Pexels photo data
 * @param sizeType The preferred size to use for the asset
 * @param includeCredits Whether to include photo credit information
 * @returns A formatted asset compatible with Uniform's SDK
 */
export function mapImageToUniformAsset(
  asset: PexelsAPIImage,
  sizeType: PexelsImageSize = "medium",
  includeCredits: boolean = true
): AssetParamValueItem {
  // Get the selected size URL (or original if not available)
  const imageUrl = asset.src[sizeType] || asset.src.original;

  // Generate a clean filename for the asset
  const fileName = generateFilename(asset, sizeType);

  // Description with optional credits
  let description = asset.alt || "";
  if (includeCredits) {
    description = `${description} Photo by ${asset.photographer} on Pexels`;
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
          photoOriginalUrl: asset.url,
          photoLargeUrl: asset.src.large,
          photoThumbnailUrl: asset.src.tiny,
          photographer: asset.photographer,
          authorProfileUrl: asset.photographer_url,
          source: "pexels",
          sourceLogoUrl: "/Pexels.svg",
        },
      },
    },
  };
}
