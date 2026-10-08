import React, { useCallback, useMemo } from "react";
import {
  useMeshLocation,
  AssetParamValueItem,
} from "@uniformdev/mesh-sdk-react";
import { Container } from "@uniformdev/design-system";
import { AssetLibrary } from "../components/AssetLibrary";
import { applyAssetPick, selectionKeyForValueItem } from "../lib/selection";

const ALL_ASSET_TYPES = ["image", "video", "audio", "other"];

export default function AssetParameter() {
  const { metadata, value, setValue } = useMeshLocation("assetParameter");

  const maxAssets = metadata.maxAssets ?? 1;
  // An empty list means every asset type is allowed
  const allowedAssetTypes = metadata.allowedAssetTypes?.length
    ? metadata.allowedAssetTypes
    : ALL_ASSET_TYPES;

  const selectedKeys = useMemo(
    () =>
      (value ?? [])
        .map(selectionKeyForValueItem)
        .filter((key): key is string => Boolean(key)),
    [value]
  );

  const handleAssetSelect = useCallback(
    (asset: AssetParamValueItem) => {
      setValue((currentValue) => ({
        newValue: applyAssetPick(currentValue, asset, maxAssets),
      }));
    },
    [setValue, maxAssets]
  );

  return (
    <Container>
      <AssetLibrary
        onAssetSelect={handleAssetSelect}
        selectedKeys={selectedKeys}
        mode="parameter"
        allowedAssetTypes={allowedAssetTypes}
      />
    </Container>
  );
}
