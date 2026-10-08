import React from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  Icon,
  MenuGroup,
  MenuItem,
  Tooltip,
} from "@uniformdev/design-system";
import { PexelsAPIImage, PexelsImageSize } from "../lib/types";
import { generateFilename, getImageSizeLabels } from "../lib/utils";
import { downloadFile } from "../lib/download";
import { CreditsPopover } from "./CreditsPopover";
import { ViewOnPexelsMenuItem } from "./ViewOnPexelsMenuItem";

interface AssetGridItemProps {
  asset: PexelsAPIImage;
  onAssetSelect?: (asset: PexelsAPIImage) => void;
  isSelected?: boolean;
}

export const AssetGridItem: React.FC<AssetGridItemProps> = ({
  asset,
  onAssetSelect,
  isSelected = false,
}) => {
  const imageSizeLabels = getImageSizeLabels(asset);
  const title = asset.alt || `Photo by ${asset.photographer}`;

  const handleDownload = (sizeType: PexelsImageSize) => {
    downloadFile(asset.src[sizeType], generateFilename(asset, sizeType));
  };

  const assetMenu = (
    <MenuGroup title="Actions">
      <ViewOnPexelsMenuItem url={asset.url} />
      <MenuGroup title="Download Options">
        {Object.entries(imageSizeLabels).map(([size, { label, description }]) => (
          <Tooltip key={size} title={description} placement="left">
            <MenuItem onClick={() => handleDownload(size as PexelsImageSize)}>
              <Icon size={12} icon="push-down" color="black" />
              {label}
            </MenuItem>
          </Tooltip>
        ))}
      </MenuGroup>
    </MenuGroup>
  );

  return (
    <ObjectGridItem
      header={
        <ObjectGridItemHeading
          data-testid="card-title"
          heading={title}
          tooltip={title}
          afterHeadingSlot={
            <CreditsPopover
              kind="Photo"
              authorName={asset.photographer}
              authorUrl={asset.photographer_url}
            />
          }
        />
      }
      cover={
        <ObjectGridItemCoverButton
          id={asset.id.toString()}
          imageUrl={asset.src.medium}
          onSelection={() => onAssetSelect?.(asset)}
          isSelected={isSelected}
        />
      }
      menuItems={assetMenu}
    />
  );
};
