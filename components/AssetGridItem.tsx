import React, { useState } from "react";
import { AssetDefinitionType } from "@uniformdev/assets";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  ImageProps,
  ObjectGridItemProps,
  Popover,
  Icon,
  MenuGroup,
  MenuItem,
  Tooltip,
  Spinner,
} from "@uniformdev/design-system";
import Image from "next/image";
import { PexelsAPIImage, PexelsImageSize } from "../lib/types";
import Link from "next/link";
import {
  mapImageToUniformAsset,
  generateFilename,
  getImageSizeLabels,
  downloadAsset,
} from "../lib/utils";
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";
import { REFERRAL_QUERY_PARAMS } from "../lib/constants";

interface AssetGridItemProps {
  asset: PexelsAPIImage;
  onAssetSelect?: (asset: any) => void;
  isSelected?: boolean;
}

export interface AssetMediaCardProps
  extends Omit<ObjectGridItemProps, "cover" | "header"> {
  title: string;
  id: string;
  url?: string;
  coverImageProps?: Omit<ImageProps, "src" | "srcSet" | "alt">;
  assetType: AssetDefinitionType;
  fileType?: string;
  ignoreMissingFileType?: boolean;
  onClick?: () => void;
}

export const AssetGridItem: React.FC<AssetGridItemProps> = ({
  asset,
  onAssetSelect,
  isSelected = false,
}) => {
  // State for download loading
  const [downloadingSize, setDownloadingSize] = useState<string | null>(null);

  // Get settings from integration settings
  const integrationSettings = useIntegrationSettings();

  // Get image size labels
  const imageSizeLabels = getImageSizeLabels(asset);

  // Function to handle download
  const handleDownload = async (sizeType: PexelsImageSize = "medium") => {
    setDownloadingSize(sizeType);
    try {
      await downloadAsset(asset, sizeType);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setDownloadingSize(null);
    }
  };

  const headingPopover = (
    <Popover buttonText="Photo credits" icon="info" ariaLabel="Photo credits">
      <div className="w-fit text-sm text-gray-400">
        <span>Photo by </span>
        <Link
          href={`${asset.photographer_url}?${REFERRAL_QUERY_PARAMS}`}
          target="_blank"
          className="text-gray-600 hover:underline"
        >
          {asset.photographer}
        </Link>
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

  const assetMenu = (
    <>
      <MenuGroup title="Actions">
        <MenuItem onClick={() => window.open(asset.url, "_blank")}>
          <Image
            src="/pexels-app-icon.svg"
            alt="View on Pexels"
            width={12}
            height={12}
          />
          View on Pexels
        </MenuItem>
        <MenuGroup title="Download Options">
          {Object.entries(imageSizeLabels).map(
            ([size, { label, description }]) => (
              <Tooltip key={size} title={description} placement="left">
                <MenuItem
                  onClick={() => handleDownload(size as PexelsImageSize)}
                  disabled={downloadingSize !== null}
                >
                  {downloadingSize === size ? (
                    <Spinner width={12} label="Downloading" />
                  ) : (
                    <Icon size={12} icon="push-down" color="black" />
                  )}
                  {downloadingSize === size ? "Downloading..." : label}
                </MenuItem>
              </Tooltip>
            )
          )}
        </MenuGroup>
      </MenuGroup>
    </>
  );

  return (
    <ObjectGridItem
      key={asset.id}
      header={
        <ObjectGridItemHeading
          data-testid="card-title"
          heading={asset.alt || `Photo by ${asset.photographer}`}
          afterHeadingSlot={headingPopover}
        />
      }
      cover={
        <ObjectGridItemCoverButton
          id={asset.id.toString()}
          imageUrl={asset.src.medium}
          onSelection={() => {
            // Call the onAssetSelect function
            onAssetSelect?.(asset);
          }}
          isSelected={isSelected}
        />
      }
      menuItems={assetMenu}
    />
  );
};
