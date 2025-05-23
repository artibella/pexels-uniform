import { useCallback } from "react";
import { PexelsAPIImage, PexelsAPIVideo, PexelsImageSize } from "../lib/types";
import { getImageSizeLabels } from "../lib/utils";
import {
  ButtonWithMenu,
  MenuItem,
  Tooltip,
  Icon,
} from "@uniformdev/design-system";

// Define interface for size labels
interface SizeLabel {
  label: string;
  description: string;
}

interface SizeLabels {
  [key: string]: SizeLabel;
}

// Props interface for the asset select button
export interface AssetSelectButtonProps {
  asset: PexelsAPIImage | PexelsAPIVideo;
  onAssetSelect: (asset: PexelsAPIImage | PexelsAPIVideo, size: string) => void;
  className?: string;
}

// Helper function for getting image size dimensions
function getSizeDimensions(size: string, image: PexelsAPIImage): string {
  // Calculate dimensions based on size
  switch (size) {
    case "original":
      return `${image.width} × ${image.height}`;
    case "large":
      return `940 × ${Math.round((940 / image.width) * image.height)}`;
    case "medium":
      return `700 × ${Math.round((700 / image.width) * image.height)}`;
    case "small":
      return `400 × ${Math.round((400 / image.width) * image.height)}`;
    default:
      return "Variable";
  }
}

export const AssetSelectButton = ({
  asset,
  onAssetSelect,
  className,
}: AssetSelectButtonProps) => {
  const isVideo = "video_files" in asset;

  // Get image size labels if not a video
  const imageSizeLabels: SizeLabels = !isVideo
    ? getImageSizeLabels(asset as PexelsAPIImage)
    : {};

  // Function to handle selecting an asset with specific size
  const handleAssetSelect = useCallback(
    (size: string) => {
      onAssetSelect(asset, size);
    },
    [asset, onAssetSelect]
  );

  // Find the best quality video file for default selection (for videos)
  const getBestVideoFile = useCallback(() => {
    if (!isVideo) return null;

    const videoFiles = (asset as PexelsAPIVideo).video_files || [];
    // First try to find an HD file
    const hdFile = videoFiles.find((file) => file.quality === "hd");
    if (hdFile) return hdFile;

    // Otherwise get the file with highest resolution
    return videoFiles.reduce((best, current) => {
      return current.width * current.height > best.width * best.height
        ? current
        : best;
    }, videoFiles[0]);
  }, [asset, isVideo]);

  // Define size order for images (largest to smallest)
  const sizeOrder = [
    "original",
    "large2x",
    "large",
    "medium",
    "small",
    "portrait",
    "landscape",
    "tiny",
  ];

  const bestVideoFile = isVideo ? getBestVideoFile() : null;

  return (
    <div className={`flex space-y-2 ${className || ""}`}>
      <ButtonWithMenu
        buttonText="Select"
        buttonType="primary"
        maxMenuHeight="auto"
        size="lg"
        onButtonClick={() => {
          if (isVideo && bestVideoFile) {
            // Select best quality video by default
            handleAssetSelect(bestVideoFile.quality);
          } else if (!isVideo) {
            // Select large size image by default (instead of medium)
            handleAssetSelect("large");
          }
        }}
      >
        <>
          {isVideo
            ? // Video file options sorted by resolution
              [...((asset as PexelsAPIVideo).video_files || [])]
                .sort((a, b) => b.width * b.height - a.width * a.height)
                .map((file) => (
                  <Tooltip
                    key={file.id}
                    title={`${file.file_type} - ${file.width}×${file.height}`}
                    placement="left"
                  >
                    <MenuItem
                      key={`menu-${file.id}`}
                      onClick={() => handleAssetSelect(file.quality)}
                    >
                      <Icon size={12} icon="check" color="black" />
                      {file.quality} ({file.width}×{file.height}) -{" "}
                      {file.file_type}
                    </MenuItem>
                  </Tooltip>
                ))
            : // Image size options sorted by predefined order
              Object.entries((asset as PexelsAPIImage).src)
                .sort((a, b) => {
                  const indexA = sizeOrder.indexOf(a[0]);
                  const indexB = sizeOrder.indexOf(b[0]);
                  return indexA - indexB;
                })
                .map(([size, url]) => (
                  <Tooltip
                    key={size}
                    title={
                      imageSizeLabels[size]?.description ||
                      getSizeDimensions(size, asset as PexelsAPIImage)
                    }
                    placement="left"
                  >
                    <MenuItem
                      key={`menu-${size}`}
                      onClick={() => handleAssetSelect(size)}
                    >
                      <Icon size={12} icon="check" color="black" />
                      {imageSizeLabels[size]?.label || size} (
                      {getSizeDimensions(size, asset as PexelsAPIImage)})
                    </MenuItem>
                  </Tooltip>
                ))}
        </>
      </ButtonWithMenu>
    </div>
  );
};
