import { useState, useEffect, useCallback } from "react";
import {
  PexelsAPIImage,
  PexelsAPIVideo,
  MediaType,
  PexelsImageSize,
} from "../types";
import { getPhotoById, getVideoById } from "../pexels";
import {
  mapImageToUniformAsset,
  mapVideoToUniformAsset,
  calculateImageDimensions,
} from "../utils";
import { useIntegrationSettings } from "./useIntegrationSettings";

export interface AssetSelectionOptions {
  selectedAssetId?: string;
  onAssetSelect?: (asset: any) => void;
  apiKeyAvailable?: boolean;
  mediaType: MediaType;
}

export function useAssetSelection(options: AssetSelectionOptions) {
  const { selectedAssetId, onAssetSelect, apiKeyAvailable, mediaType } =
    options;

  // Get integration settings for author credits
  const integrationSettings = useIntegrationSettings();
  const includeAuthorCredits = integrationSettings?.addAuthorCredits ?? true;

  const [selectedId, setSelectedId] = useState<string | undefined>(
    selectedAssetId
  );

  // Fetch a selected asset by ID when selectedAssetId changes
  useEffect(() => {
    const fetchSelectedAsset = async () => {
      if (!selectedAssetId) return;

      try {
        // Use getPhotoById for photos or getVideoById for videos
        const asset =
          mediaType === MediaType.Photo
            ? await getPhotoById(parseInt(selectedAssetId, 10))
            : await getVideoById(parseInt(selectedAssetId, 10));

        if (asset) {
          setSelectedId(selectedAssetId);
        }
      } catch (error) {
        console.error("Error fetching selected asset:", error);
      }
    };

    fetchSelectedAsset();
  }, [selectedAssetId, mediaType]);

  // Handler for asset selection
  const handleAssetSelect = useCallback(
    (asset: PexelsAPIImage | PexelsAPIVideo, size?: string) => {
      setSelectedId(asset.id.toString());
      if (onAssetSelect) {
        // Map to uniform asset based on media type
        if ("video_files" in asset) {
          // It's a video - use updated mapVideoToUniformAsset with quality parameter
          onAssetSelect(
            mapVideoToUniformAsset(
              asset as PexelsAPIVideo,
              includeAuthorCredits,
              size // Pass the quality preference
            )
          );
        } else {
          // It's a photo - no need for modified asset, our updated function handles dimension calculations
          onAssetSelect(
            mapImageToUniformAsset(
              asset as PexelsAPIImage,
              size as PexelsImageSize, // Cast to the correct type
              includeAuthorCredits
            )
          );
        }
      }
    },
    [onAssetSelect, includeAuthorCredits]
  );

  return {
    selectedId,
    handleAssetSelect,
  };
}
