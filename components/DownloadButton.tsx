import { useCallback } from "react";
import { PexelsAPIImage, PexelsAPIVideo, PexelsImageSize } from "../lib/types";
import {
  calculateImageDimensions,
  getImageSizeLabels,
  generateFilename,
  downloadAsset,
} from "../lib/utils";
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

// Props interface for the download button
export interface DownloadButtonProps {
  asset: PexelsAPIImage | PexelsAPIVideo;
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

export const DownloadButton = ({ asset, className }: DownloadButtonProps) => {
  const isVideo = "video_files" in asset;

  // Get image size labels if not a video
  const imageSizeLabels: SizeLabels = !isVideo
    ? getImageSizeLabels(asset as PexelsAPIImage)
    : {};

  // Function to handle downloading an asset
  const handleDownload = useCallback(
    (url: string, sizeName: string = "original") => {
      downloadAsset(asset, sizeName);
    },
    [asset]
  );

  // Find the best quality video file for default download (for videos)
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
        buttonText="Download"
        buttonType="secondary"
        maxMenuHeight="auto"
        size="lg"
        onButtonClick={() => {
          if (isVideo && bestVideoFile) {
            // Download best quality video by default
            downloadAsset(asset, bestVideoFile.quality);
          } else if (!isVideo && (asset as PexelsAPIImage).src.original) {
            // Download original size image by default
            downloadAsset(asset, "original");
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
                      onClick={() =>
                        downloadAsset(asset, file.quality, file.id)
                      }
                    >
                      <Icon size={12} icon="push-down" color="black" />
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
                .map(([size, url]) => {
                  // Calculate dimensions using the shared function
                  const dimensions = calculateImageDimensions(
                    asset as PexelsAPIImage,
                    size as PexelsImageSize
                  );
                  const dimensionText = `${dimensions.width}×${dimensions.height}`;

                  return (
                    <Tooltip
                      key={size}
                      title={
                        imageSizeLabels[size]?.description || dimensionText
                      }
                      placement="left"
                    >
                      <MenuItem
                        key={`menu-${size}`}
                        onClick={() => downloadAsset(asset, size)}
                      >
                        <Icon size={12} icon="push-down" color="black" />
                        {imageSizeLabels[size]?.label || size} ({dimensionText})
                      </MenuItem>
                    </Tooltip>
                  );
                })}
        </>
      </ButtonWithMenu>
    </div>
  );
};
