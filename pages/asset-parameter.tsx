import React, { useCallback, useMemo } from "react";
import {
  useMeshLocation,
  AssetParamValueItem,
} from "@uniformdev/mesh-sdk-react";
import { Container, toast } from "@uniformdev/design-system";
import { AssetLibrary } from "../components/AssetLibrary";
import { ImportDelegationProvider } from "../components/ImportDelegationProvider";
import {
  applyAssetImport,
  applyAssetPick,
  selectionKeyForValueItem,
} from "../lib/selection";

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

  // Selects the imported Uniform asset: it replaces a single-asset value and is added to a
  // multi-asset one, next to any Pexels-hosted pick of the same item
  const handleAssetImported = useCallback(
    (asset: AssetParamValueItem) => {
      const isFull =
        maxAssets > 1 &&
        (value?.length ?? 0) >= maxAssets &&
        !value?.some((item) => item._id === asset._id);
      if (isFull) {
        toast.warning(
          `The asset was added to the library, but this parameter already holds ${maxAssets} assets.`
        );
        return;
      }
      setValue((currentValue) => ({
        newValue: applyAssetImport(currentValue, asset, maxAssets),
      }));
    },
    [setValue, maxAssets, value]
  );

  return (
    <Container>
      <ImportDelegationProvider>
        <AssetLibrary
          onAssetSelect={handleAssetSelect}
          onAssetImported={handleAssetImported}
          selectedKeys={selectedKeys}
          source={metadata.sourceId}
          mode="parameter"
          allowedAssetTypes={allowedAssetTypes}
        />
      </ImportDelegationProvider>
    </Container>
  );
}
