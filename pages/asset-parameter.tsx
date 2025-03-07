import React, { useCallback } from "react";
import {
  useMeshLocation,
  AssetParamValueItem,
} from "@uniformdev/mesh-sdk-react";
import { Container } from "@uniformdev/design-system";
import { AssetLibrary } from "../components/AssetLibrary";

// Specialized parameter page for asset parameters
export default function AssetParameter() {
  // Use the mesh location to access and set the parameter value
  const { metadata, value, setValue } = useMeshLocation("assetParameter");

  // Get the current selected asset id from the value
  // Since we don't have access to the asset ID directly, we'll pass undefined for now
  // The AssetLibrary component will handle this properly
  const selectedAssetId = undefined;

  // Handler for selecting an asset from our library
  const handleAssetSelect = useCallback(
    (asset: any) => {
      if (!asset) return;

      // Set the value of the parameter
      setValue(() => ({
        newValue: [asset],
      }));
    },
    [setValue]
  );

  return (
    <Container>
      <AssetLibrary
        onAssetSelect={handleAssetSelect}
        selectedAssetId={selectedAssetId}
        mode="parameter"
      />
    </Container>
  );
}
