import { PexelsAPIImage, PexelsAPIVideo, MediaType } from "../lib/types";
import {
  Button,
  HorizontalRhythm,
  Image,
  VerticalRhythm,
  Heading,
  Details,
} from "@uniformdev/design-system";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getImageSizeLabels, downloadAsset } from "../lib/utils";
import { DownloadButton } from "./DownloadButton";
import { AssetSelectButton } from "./AssetSelectButton";
// Define interface for size labels
interface SizeLabel {
  label: string;
  description: string;
}

interface SizeLabels {
  [key: string]: SizeLabel;
}

export type AssetPreviewProps = {
  asset: PexelsAPIImage | PexelsAPIVideo;
  onAssetSelect?: (
    asset: PexelsAPIImage | PexelsAPIVideo,
    size?: string
  ) => void;
  mode?: "parameter" | "library";
};

export const AssetPreview = ({
  asset,
  onAssetSelect,
  mode = "library",
}: AssetPreviewProps) => {
  const isVideo = "video_files" in asset;
  const assetTitle = isVideo
    ? `Video by ${asset.user?.name || "Unknown"}`
    : (asset as PexelsAPIImage).alt ||
      `Photo by ${asset.photographer || "Unknown"}`;

  // Handler for asset selection with size
  const handleAssetSelect = useCallback(
    (asset: PexelsAPIImage | PexelsAPIVideo, size: string) => {
      if (onAssetSelect) {
        onAssetSelect(asset, size);
      }
    },
    [onAssetSelect]
  );

  const averageColor = (asset as PexelsAPIImage).avg_color;

  return (
    <VerticalRhythm gap="lg" className="h-full">
      {/* Main content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left side: Asset preview */}
        <VerticalRhythm gap="md" className="col-span-8">
          {/* Asset preview */}
          <div className="flex items-center justify-center">
            {isVideo ? (
              <VideoPreview video={asset as PexelsAPIVideo} />
            ) : (
              <ImagePreview image={asset as PexelsAPIImage} />
            )}
          </div>
        </VerticalRhythm>

        {/* Right side: Details and actions */}
        <div className="col-span-4 flex flex-col h-full">
          <VerticalRhythm gap="md" className="flex-grow">
            {/* Basic metadata */}
            <div className="bg-gray-50 h-full w-full p-8">
              <div className="mb-8">
                <Link
                  href={
                    isVideo
                      ? (asset as PexelsAPIVideo).url
                      : (asset as PexelsAPIImage).url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline block"
                  title="View on Pexels"
                >
                  <Image
                    src="/pexels-app-icon.svg"
                    alt="Pexels logo"
                    className="block h-4 w-4 mr-3"
                    width={16}
                    height={16}
                  />
                  View on Pexels
                </Link>
                <div>
                  <Link
                    href={
                      isVideo
                        ? (asset as PexelsAPIVideo).user?.url
                        : (asset as PexelsAPIImage).photographer_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    <span className="">By </span>
                    {isVideo
                      ? (asset as PexelsAPIVideo).user?.name
                      : (asset as PexelsAPIImage).photographer}
                  </Link>
                </div>
              </div>

              <h3 className="mb-8 font-medium">{assetTitle}</h3>

              <div className="asset-preview-meta">
                <Details
                  summary="Meta"
                  isOpenByDefault={true}
                  isIndented={true}
                  className=""
                >
                  <dl className="asset-preview-meta">
                    <dt className="font-medium">Dimensions:</dt>
                    <dd>
                      {isVideo
                        ? getVideoDimensions(asset as PexelsAPIVideo)
                        : `${asset.width} × ${asset.height}`}
                    </dd>
                    {!isVideo && (
                      <>
                        <dt className="font-medium mt-4">Average Color:</dt>
                        <dd className="mt-2 flex items-center">
                          <div
                            className="inline-block rounded-full w-6 h-6"
                            aria-hidden={true}
                            style={{
                              backgroundColor: averageColor,
                            }}
                          ></div>
                          <div className="ml-2">
                            <code className="text-sm rounded bg-gray-100 p-1">
                              {averageColor}
                            </code>
                          </div>
                        </dd>
                      </>
                    )}
                  </dl>
                </Details>
              </div>
              <div className="asset-preview-buttons">
                <HorizontalRhythm gap="sm" className="mt-8">
                  {mode === "parameter" && onAssetSelect && (
                    <AssetSelectButton
                      asset={asset}
                      onAssetSelect={handleAssetSelect}
                      className=""
                    />
                  )}
                  <DownloadButton asset={asset} className="" />
                </HorizontalRhythm>
              </div>
            </div>
          </VerticalRhythm>

          {/* Bottom buttons container */}
        </div>
      </div>
    </VerticalRhythm>
  );
};

// Helper components
const ImagePreview = ({ image }: { image: PexelsAPIImage }) => (
  <div className="max-h-full max-w-full overflow-hidden">
    <img
      src={image.src.large}
      alt={image.alt || `Photo by ${image.photographer}`}
      className="max-h-[90vh] max-w-full object-contain"
    />
  </div>
);

const VideoPreview = ({ video }: { video: PexelsAPIVideo }) => {
  // Find HD or the best quality available
  const videoFile =
    video.video_files?.find((file) => file.quality === "hd") ||
    video.video_files?.[0];

  return videoFile ? (
    <div className="max-h-full max-w-full overflow-hidden">
      <video controls className="max-h-[90vh] max-w-full" poster={video.image}>
        <source src={videoFile.link} type={videoFile.file_type} />
        Your browser does not support the video tag.
      </video>
    </div>
  ) : (
    <div>Video preview not available</div>
  );
};

function getVideoDimensions(video: PexelsAPIVideo): string {
  return video.width && video.height
    ? `${video.width} × ${video.height}`
    : "Variable";
}
