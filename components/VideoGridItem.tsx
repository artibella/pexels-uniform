import React, { useState, useRef, useEffect } from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  Popover,
  Icon,
  MenuGroup,
  MenuItem,
  Tooltip,
  Spinner,
} from "@uniformdev/design-system";
import Image from "next/image";
import Link from "next/link";
import { PexelsAPIVideo } from "../lib/types";
import { REFERRAL_QUERY_PARAMS } from "../lib/constants";
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";

interface VideoGridItemProps {
  asset: PexelsAPIVideo;
  onAssetSelect?: (asset: any) => void;
  isSelected?: boolean;
}

export const VideoGridItem: React.FC<VideoGridItemProps> = ({
  asset,
  onAssetSelect,
  isSelected = false,
}) => {
  // State for download loading
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  // States for video preview
  const [showPreview, setShowPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Format duration to minutes:seconds
  const formatDuration = (seconds: number | null | undefined) => {
    // If duration is not available, return "0:00"
    if (seconds == null) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Get a thumbnail image for the video with fallbacks
  const thumbnailUrl = (() => {
    // First try image property as it provides better quality thumbnails
    if (asset.image) {
      return asset.image;
    }

    // Then try video_pictures as fallback
    if (asset.video_pictures && asset.video_pictures.length > 0) {
      const firstPicture = asset.video_pictures[0];
      if (firstPicture && firstPicture.picture) {
        return firstPicture.picture;
      }
    }

    // Default fallback
    return "https://via.placeholder.com/640x360?text=No+Preview";
  })();

  // Find the best video file for preview (prefer SD for faster loading)
  const previewVideoUrl = (() => {
    if (!asset.video_files || asset.video_files.length === 0) {
      return null;
    }

    // First try to find an SD file with medium resolution
    const sdFile = asset.video_files.find(
      (file) => file.quality === "sd" && file.width >= 640 && file.height >= 360
    );
    if (sdFile && sdFile.link) {
      return sdFile.link;
    }

    // If no suitable SD file, use the smallest HD file
    const hdFiles = asset.video_files
      .filter((file) => file.quality === "hd" && file.link)
      .sort((a, b) => a.width * a.height - b.width * b.height);

    if (hdFiles.length > 0) {
      return hdFiles[0].link;
    }

    // Last resort: use any available file
    return asset.video_files[0]?.link || null;
  })();

  // Handle hover events for video preview
  const handleMouseEnter = () => {
    setIsHovering(true);

    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // If the video is already loaded, just resume playing
    if (showPreview && videoLoaded && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Error resuming video:", err);
      });
      return;
    }

    // Start a new timer to show preview after 3 seconds
    hoverTimerRef.current = setTimeout(() => {
      if (previewVideoUrl) {
        setShowPreview(true);

        // If video not loaded yet, it will be handled by the useEffect
        // If video is already loaded, play it
        if (videoLoaded && videoRef.current) {
          videoRef.current.play().catch((err) => {
            console.error("Error auto-playing video:", err);
          });
        }
      }
    }, 2000);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);

    // Clear the timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Do not hide the preview, just pause the video
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Load and play video when showPreview becomes true
  useEffect(() => {
    if (showPreview && videoRef.current && !videoLoaded) {
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setVideoLoaded(true);
        })
        .catch((err) => {
          console.error("Error playing video:", err);
          // If autoplay fails, revert to showing the thumbnail
          setShowPreview(false);
        });
    }

    // Cleanup on unmount
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [showPreview, previewVideoUrl]);

  // Function to reset video state
  const resetVideo = () => {
    setShowPreview(false);
    setVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Reset video when asset changes
  useEffect(() => {
    resetVideo();
  }, [asset.id]);

  // Function to handle download
  const handleDownload = async (fileIndex: number) => {
    setDownloadingIndex(fileIndex);
    try {
      const videoFile = asset.video_files[fileIndex];
      if (!videoFile) return;

      // Generate filename with fallbacks for missing properties
      const width = videoFile.width || 0;
      const height = videoFile.height || 0;

      // Get file extension, with fallback to mp4
      let fileExt = "mp4";
      if (videoFile.file_type) {
        const parts = videoFile.file_type.split("/");
        if (parts.length > 1 && parts[1]) {
          fileExt = parts[1];
        }
      }

      const fileName = `pexels-video-${asset.id}-${width}x${height}.${fileExt}`;

      // Check if link is available
      if (!videoFile.link) {
        console.error("Video file has no download link");
        return;
      }

      // Create a link element to trigger the download
      const link = document.createElement("a");
      link.href = videoFile.link;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading video:", error);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const headingPopover = (
    <Popover buttonText="Video credits" icon="info" ariaLabel="Video credits">
      <div className="w-fit text-sm text-gray-400">
        <span>Video by </span>
        {asset.user && asset.user.url ? (
          <Link
            href={`${asset.user.url}?${REFERRAL_QUERY_PARAMS}`}
            target="_blank"
            className="text-gray-600 hover:underline"
          >
            {asset.user.name || "Unknown"}
          </Link>
        ) : (
          <span className="text-gray-600">{asset.user?.name || "Unknown"}</span>
        )}
        <span> on </span>
        <Link
          href={`https://www.pexels.com?${REFERRAL_QUERY_PARAMS}`}
          target="_blank"
          className="text-gray-600 hover:underline"
        >
          Pexels
        </Link>
      </div>
    </Popover>
  );

  const videoMetadata = (
    <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
      <div className="flex items-center">
        <Icon icon="timer" size={10} className="mr-1" />
        <span>{formatDuration(asset.duration)}</span>
      </div>
      <div className="flex items-center">
        <Icon icon="size" size={10} className="mr-1" />
        <span>
          {asset.width || 0}x{asset.height || 0}
        </span>
      </div>
    </div>
  );

  const assetMenu = (
    <>
      <MenuGroup title="Actions">
        <MenuItem onClick={() => asset.url && window.open(asset.url, "_blank")}>
          <Image
            src="/pexels-app-icon.svg"
            alt="View on Pexels"
            width={12}
            height={12}
          />
          View on Pexels
        </MenuItem>
        <MenuGroup title="Download Options">
          {(asset.video_files || []).map((file, index) => (
            <Tooltip
              key={file.id || index}
              title={`${file.width || 0}x${file.height || 0} - ${
                file.quality ? file.quality.toUpperCase() : "UNKNOWN"
              } - ${file.fps || 0}fps`}
              placement="left"
            >
              <MenuItem
                onClick={() => handleDownload(index)}
                disabled={downloadingIndex !== null}
              >
                {downloadingIndex === index ? (
                  <Spinner width={12} label="Downloading" />
                ) : (
                  <Icon size={12} icon="push-down" color="black" />
                )}
                {downloadingIndex === index
                  ? "Downloading..."
                  : `${file.width || 0}x${file.height || 0} (${
                      file.quality ? file.quality.toUpperCase() : "UNKNOWN"
                    })`}
              </MenuItem>
            </Tooltip>
          ))}
        </MenuGroup>
      </MenuGroup>
    </>
  );

  return (
    <ObjectGridItem
      key={asset.id}
      header={
        <div>
          <ObjectGridItemHeading
            data-testid="card-title"
            heading={`Video by ${asset.user?.name || "Unknown"}`}
            afterHeadingSlot={headingPopover}
          />
          {videoMetadata}
        </div>
      }
      cover={
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Selection button with thumbnail image */}
          <ObjectGridItemCoverButton
            id={asset.id?.toString() || "0"}
            imageUrl={thumbnailUrl}
            onSelection={() => {
              onAssetSelect?.(asset);
            }}
            isSelected={isSelected}
          />

          {/* Video preview overlay */}
          {showPreview && previewVideoUrl && (
            <div
              className={`absolute inset-0 bg-black flex items-center justify-center pointer-events-none ${
                isHovering ? "opacity-100" : "opacity-90"
              }`}
            >
              <video
                ref={videoRef}
                className="max-w-full max-h-full object-contain"
                muted
                playsInline
                loop
                style={{ width: "100%", height: "100%" }}
              >
                <source src={previewVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(asset.duration)}
          </div>

          {/* Loading indicator during hover delay */}
          {isHovering && !showPreview && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              <span className="text-xs">Preview loading...</span>
            </div>
          )}
        </div>
      }
      menuItems={assetMenu}
    />
  );
};
