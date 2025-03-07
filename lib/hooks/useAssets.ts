import { useEffect, useState } from "react";
import { PexelsAPIImage, AssetLibraryMetadata } from "../types";
import { searchAssets, getFeaturedAssets } from "../pexels";

// Extended metadata type to include pagination parameters
type ExtendedAssetMetadata = AssetLibraryMetadata & {
  page?: number;
};

export const useAssets = (metadata: ExtendedAssetMetadata) => {
  const [assets, setAssets] = useState<PexelsAPIImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number>(0);

  const fetchFeaturedAssets = async () => {
    setIsLoading(true);
    try {
      // Configure options for featured assets request
      const options = {
        perPage: metadata.limit,
        page: metadata.page || 1,
      };

      // Get featured assets
      const { photos, totalResults: total } = await getFeaturedAssets(
        metadata.apiKey,
        options
      );

      setAssets(photos);
      setTotalResults(total);
    } catch (error) {
      console.error("Error fetching featured assets:", error);
      setAssets([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSearchAssets = async () => {
    setIsLoading(true);
    try {
      if (!metadata.query) {
        setAssets([]);
        setTotalResults(0);
        return;
      }

      // Configure options for search request
      const options = {
        perPage: metadata.limit,
        page: metadata.page || 1,
        orientation: metadata.orientation,
        color: metadata.color,
      };

      // Search assets
      const { photos, totalResults: total } = await searchAssets(
        metadata.apiKey,
        metadata.query,
        options
      );

      setAssets(photos);
      setTotalResults(total);
    } catch (error) {
      console.error("Error searching assets:", error);
      setAssets([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAssets = async () => {
      if (metadata.query) {
        await fetchSearchAssets();
      } else {
        await fetchFeaturedAssets();
      }
    };

    if (metadata.apiKey) {
      fetchAssets();
    } else {
      console.error("No API key provided");
      setAssets([]);
      setTotalResults(0);
    }
  }, [
    metadata.query,
    metadata.limit,
    metadata.apiKey,
    metadata.color,
    metadata.orientation,
    metadata.page,
  ]);

  return { assets, isLoading, totalResults };
};

// Export previous names for backward compatibility
export const usePhotoAssets = useAssets;
export const usePexelsAssets = useAssets;
