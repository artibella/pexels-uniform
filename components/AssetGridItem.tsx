import React from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
  ObjectGridItemCoverButton,
  MenuGroup,
} from "@uniformdev/design-system";
import { PexelsAPIImage, PexelsImageSize } from "../lib/types";
import { generateFilename, getImageSizeLabels } from "../lib/utils";
import { downloadFile } from "../lib/download";
import { AssetImporter } from "../lib/hooks/useAssetImport";
import { CreditsPopover } from "./CreditsPopover";
import { ImportSubmenu } from "./ImportSubmenu";
import { OptionsSubmenu, SubmenuOption } from "./OptionsSubmenu";
import { ViewOnPexelsMenuItem } from "./ViewOnPexelsMenuItem";

interface AssetGridItemProps {
  asset: PexelsAPIImage;
  onAssetSelect?: (asset: PexelsAPIImage) => void;
  isSelected?: boolean;
  /** Adds the "Add to asset library" menu when set */
  importer?: AssetImporter;
}

export const AssetGridItem: React.FC<AssetGridItemProps> = ({
  asset,
  onAssetSelect,
  isSelected = false,
  importer,
}) => {
  const imageSizeLabels = getImageSizeLabels(asset);
  const title = asset.alt || `Photo by ${asset.photographer}`;

  const handleDownload = (sizeType: PexelsImageSize) => {
    downloadFile(asset.src[sizeType], generateFilename(asset, sizeType));
  };

  const options: SubmenuOption[] = Object.entries(imageSizeLabels).map(
    ([size, { label, description }]) => ({ variant: size, label, description })
  );

  const assetMenu = (
    <MenuGroup title="Actions">
      <ViewOnPexelsMenuItem url={asset.url} />
      <OptionsSubmenu
        label="Download"
        icon="push-down"
        options={options}
        onSelect={({ variant }) => handleDownload(variant as PexelsImageSize)}
      />
      {importer && (
        <ImportSubmenu importer={importer} kind="photo" pexelsId={asset.id} options={options} />
      )}
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
