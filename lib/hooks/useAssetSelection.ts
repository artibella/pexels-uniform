import { useCallback } from "react";
import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { PexelsAPIImage, PexelsAPIVideo } from "../types";
import {
  mapImageToUniformAsset,
  mapVideoToUniformAsset,
  pickBestVideoFile,
} from "../mapping";
import { useIntegrationSettings } from "./useIntegrationSettings";

export interface AssetSelectionOptions {
  onAssetSelect?: (asset: AssetParamValueItem) => void;
  /** Uniform integration source ID, stored as the asset's `_source` */
  source?: string;
}

/**
 * Maps a picked Pexels asset to a Uniform asset value item and hands it to onAssetSelect.
 */
export function useAssetSelection({ onAssetSelect, source }: AssetSelectionOptions) {
  const integrationSettings = useIntegrationSettings();
  const includeAuthorCredits = integrationSettings?.addAuthorCredits ?? true;

  const handleAssetSelect = useCallback(
    (asset: PexelsAPIImage | PexelsAPIVideo) => {
      if (!onAssetSelect) return;
      const mappingOptions = { source, includeAuthorCredits };
      if ("video_files" in asset) {
        // A video without files has nothing to play, so it can't be stored
        if (!pickBestVideoFile(asset.video_files)) return;
        onAssetSelect(mapVideoToUniformAsset(asset, mappingOptions));
      } else {
        onAssetSelect(mapImageToUniformAsset(asset, mappingOptions));
      }
    },
    [onAssetSelect, source, includeAuthorCredits]
  );

  return { handleAssetSelect };
}
