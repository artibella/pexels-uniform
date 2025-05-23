import React, { useCallback, useEffect, useState } from "react";

import {
  Callout,
  LoadingOverlay,
  useMeshLocation,
} from "@uniformdev/mesh-sdk-react";
import { PexelsAPIImage, PexelsAPIVideo, MediaType } from "../lib/types";
import { AssetPreview } from "../components/AssetPreview";
import { useIntegrationSettings } from "../lib/hooks";
import { getPhotoById, getVideoById } from "../lib/pexels";

type AssetPreviewParams = {
  id?: string;
  mode?: "parameter" | "library";
  mediaType?: "photo" | "video";
};

export default function AssetPreviewDialog() {
  const { dialogContext } = useMeshLocation();
  const settings = useIntegrationSettings();

  // Extract params from dialogContext
  const params = (dialogContext?.params as AssetPreviewParams) || {};
  const mode = params?.mode || "library";
  const assetId = params?.id;
  const mediaType = params?.mediaType;

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<PexelsAPIImage | PexelsAPIVideo | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch the asset when the component mounts
  useEffect(() => {
    const fetchAsset = async () => {
      if (!assetId) {
        setError("No asset ID provided");
        setLoading(false);
        return;
      }

      // Check if media type is specified
      if (!mediaType) {
        setError("Asset type (photo or video) must be specified");
        setLoading(false);
        return;
      }

      // Track if we need to continue trying different asset types
      let assetFound = false;

      try {
        // If we know it's a video, skip the photo request
        if (mediaType === "video") {
          try {
            console.log("Fetching known video type with ID:", assetId);
            const video = await getVideoById(parseInt(assetId, 10));
            if (video) {
              console.log("Successfully fetched video:", video.id);
              setAsset(video);
              assetFound = true;
            }
          } catch (videoError) {
            console.error("Video fetch failed:", videoError);
            throw new Error("Video asset not found");
          }
        }
        // If we know it's a photo, skip the video request
        else if (mediaType === "photo") {
          try {
            console.log("Fetching known photo type with ID:", assetId);
            const photo = await getPhotoById(parseInt(assetId, 10));
            if (photo) {
              console.log("Successfully fetched photo:", photo.id);
              setAsset(photo);
              assetFound = true;
            }
          } catch (photoError) {
            console.error("Photo fetch failed:", photoError);
            throw new Error("Photo asset not found");
          }
        }
        // If we have an invalid media type
        else {
          throw new Error(
            `Invalid media type: ${mediaType}. Must be "photo" or "video".`
          );
        }

        // If we've reached this point and still haven't found an asset, throw error
        if (!assetFound) {
          throw new Error("Asset not found with ID: " + assetId);
        }
      } catch (err) {
        console.error("Error fetching asset:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        // Always set loading to false when we're done, whether successful or not
        setLoading(false);
      }
    };

    fetchAsset();
  }, [assetId, mediaType]);

  const onAssetSelect = useCallback(
    (selectedAsset: PexelsAPIImage | PexelsAPIVideo) => {
      if (dialogContext) {
        dialogContext.returnDialogValue({
          asset: selectedAsset,
        });
      }
    },
    [dialogContext]
  );

  if (loading) {
    return <LoadingOverlay isActive={true} />;
  }

  if (error) {
    return <Callout type="error">{error}</Callout>;
  }

  if (!asset) {
    return <Callout type="info">Asset not found</Callout>;
  }

  return (
    <AssetPreview asset={asset} onAssetSelect={onAssetSelect} mode={mode} />
  );
}
