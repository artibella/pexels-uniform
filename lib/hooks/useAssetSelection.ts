import { useCallback } from "react";
import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { PexelsAPIImage, PexelsAPIVideo } from "../types";
import {
  mapImageToUniformAsset,
  mapVideoToUniformAsset,
  pickBestVideoFile,
} from "../utils";
import { useIntegrationSettings } from "./useIntegrationSettings";

export interface AssetSelectionOptions {
  onAssetSelect?: (asset: AssetParamValueItem) => void;
}

/**
 * Maps a picked Pexels asset to a Uniform asset value item and hands it to onAssetSelect.
 */
export function useAssetSelection({ onAssetSelect }: AssetSelectionOptions) {
  const integrationSettings = useIntegrationSettings();
  const includeAuthorCredits = integrationSettings?.addAuthorCredits ?? true;

  const handleAssetSelect = useCallback(
    (asset: PexelsAPIImage | PexelsAPIVideo) => {
      if (!onAssetSelect) return;
      // A video without files has nothing to play, so it can't be stored
      if ("video_files" in asset && !pickBestVideoFile(asset.video_files)) {
        return;
      }
      onAssetSelect(
        "video_files" in asset
          ? mapVideoToUniformAsset(asset, includeAuthorCredits)
          : mapImageToUniformAsset(asset, undefined, includeAuthorCredits)
      );
    },
    [onAssetSelect, includeAuthorCredits]
  );

  return { handleAssetSelect };
}
