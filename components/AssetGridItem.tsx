import React from "react";
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
} from "@uniformdev/design-system";
import Image from "next/image";
import { PexelsAPIImage, PexelsImageSize } from "../lib/types";
import Link from "next/link";
import { mapImageToUniformAsset, generateFilename } from "../lib/utils";
import { REFERRAL_QUERY_PARAMS } from "../lib/constants";
import { downloadFile } from "../lib/download";
import { getImageSizeLabels } from "../lib/utils";

interface AssetGridItemProps {
  asset: PexelsAPIImage;
  onAssetSelect?: (asset: PexelsAPIImage) => void;
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
  // Get image size labels
  const imageSizeLabels = getImageSizeLabels(asset);

  const handleDownload = (sizeType: PexelsImageSize) => {
    downloadFile(asset.src[sizeType], generateFilename(asset, sizeType));
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
                <MenuItem onClick={() => handleDownload(size as PexelsImageSize)}>
                  <Icon size={12} icon="push-down" color="black" />
                  {label}
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
