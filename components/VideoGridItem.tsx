import React, { useEffect, useRef, useState } from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  Icon,
  MenuGroup,
} from "@uniformdev/design-system";
import { PexelsAPIVideo, PexelsVideoFile } from "../lib/types";
import { downloadFile } from "../lib/download";
import { formatDuration, generateVideoFilename } from "../lib/utils";
import { AssetImporter } from "../lib/hooks/useAssetImport";
import { CreditsPopover } from "./CreditsPopover";
import { ImportSubmenu } from "./ImportSubmenu";
import { OptionsSubmenu, SubmenuOption } from "./OptionsSubmenu";
import { ViewOnPexelsMenuItem } from "./ViewOnPexelsMenuItem";

// Delay before the hover preview starts, so moving the pointer across the
// grid doesn't start downloading every video
const PREVIEW_DELAY_MS = 2000;

interface VideoGridItemProps {
  asset: PexelsAPIVideo;
  onAssetSelect?: (asset: PexelsAPIVideo) => void;
  isSelected?: boolean;
  /** Adds the "Add to asset library" menu when set */
  importer?: AssetImporter;
}

/** Smallest file that is at least 640px wide, for a quick preview */
function pickPreviewFile(files: PexelsVideoFile[]): PexelsVideoFile | undefined {
  const bySize = [...files].sort((a, b) => a.width * a.height - b.width * b.height);
  return bySize.find((file) => file.width >= 640) ?? bySize[0];
}

// Pexels leaves quality out for some files, so it is only shown when known
function formatFile(file: PexelsVideoFile): string {
  const size = `${file.width ?? 0}×${file.height ?? 0}`;
  return file.quality ? `${size} (${file.quality.toUpperCase()})` : size;
}

function describeFile(file: PexelsVideoFile): string {
  return file.fps ? `${formatFile(file)} · ${Math.round(file.fps)} fps` : formatFile(file);
}

export const VideoGridItem: React.FC<VideoGridItemProps> = ({
  asset,
  onAssetSelect,
  isSelected = false,
  importer,
}) => {
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const files = asset.video_files ?? [];
  const previewFile = pickPreviewFile(files);
  const thumbnailUrl =
    asset.image || asset.video_pictures?.[0]?.picture || "/pexels-app-icon.svg";

  const startPreview = () => {
    setIsPointerInside(true);
    if (!previewFile) return;
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setShowPreview(true), PREVIEW_DELAY_MS);
  };

  const stopPreview = () => {
    setIsPointerInside(false);
    clearTimeout(previewTimer.current);
    setShowPreview(false);
  };

  useEffect(() => () => clearTimeout(previewTimer.current), []);

  const handleDownload = (file: PexelsVideoFile) => {
    downloadFile(file.link, generateVideoFilename(asset, file));
  };

  const options: SubmenuOption[] = files.map((file) => ({
    variant: String(file.id),
    label: formatFile(file),
    description: describeFile(file),
  }));

  const assetMenu = (
    <MenuGroup title="Actions">
      <ViewOnPexelsMenuItem url={asset.url} />
      <OptionsSubmenu
        label="Download"
        icon="push-down"
        options={options}
        onSelect={({ variant }) => {
          const file = files.find((candidate) => String(candidate.id) === variant);
          if (file) handleDownload(file);
        }}
      />
      {importer && (
        <ImportSubmenu importer={importer} kind="video" pexelsId={asset.id} options={options} />
      )}
    </MenuGroup>
  );

  const authorName = asset.user?.name || "Unknown";

  return (
    <ObjectGridItem
      header={
        <div>
          <ObjectGridItemHeading
            data-testid="card-title"
            heading={`Video by ${authorName}`}
            tooltip={`Video by ${authorName}`}
            afterHeadingSlot={
              <CreditsPopover
                kind="Video"
                authorName={authorName}
                authorUrl={asset.user?.url}
              />
            }
          />
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
        </div>
      }
      cover={
        // Focus starts the preview too, so it works with the keyboard
        <div
          className="relative"
          onMouseEnter={startPreview}
          onMouseLeave={stopPreview}
          onFocus={startPreview}
          onBlur={stopPreview}
        >
          <ObjectGridItemCoverButton
            id={asset.id.toString()}
            imageUrl={thumbnailUrl}
            onSelection={() => onAssetSelect?.(asset)}
            isSelected={isSelected}
          />

          {showPreview && previewFile && (
            <div className="absolute inset-0 bg-black flex items-center justify-center pointer-events-none">
              <video
                className="w-full h-full object-contain"
                src={previewFile.link}
                autoPlay
                muted
                playsInline
                loop
                onError={() => setShowPreview(false)}
              />
            </div>
          )}

          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(asset.duration)}
          </div>

          {isPointerInside && previewFile && !showPreview && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              Preview loading...
            </div>
          )}
        </div>
      }
      menuItems={assetMenu}
    />
  );
};
