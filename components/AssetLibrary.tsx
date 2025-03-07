import React, { useState, useEffect, useRef, useCallback } from "react";
import { AssetGridItem } from "./AssetGridItem";
import { SearchBar } from "./SearchBar";
import { ErrorState } from "./ErrorState";
import { AssetLibraryHeader } from "./AssetLibraryHeader";
import { PexelsAPIImage } from "../lib/types";
import { searchAssets, getFeaturedAssets, getAssetById } from "../lib/pexels";
import {
  Container,
  Icon,
  Heading,
  DashedBox,
  Pagination,
  ObjectGridContainer,
} from "@uniformdev/design-system";
import { mapImageToUniformAsset } from "../lib/utils";
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";

import { useAssets } from "../lib/hooks/useAssets";
import { AssetGridItemSkeleton } from "./AssetGridItemSkeleton";
import { EmptyState } from "./EmptyState";

export interface AssetLibraryProps {
  onAssetSelect?: (asset: any) => void;
  selectedAssetId?: string;
  initialSearchQuery?: string;
  mode?: "parameter" | "library";
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  selectedAssetId,
  initialSearchQuery = "",
  mode = "library",
}) => {
  // Get settings
  const integrationSettings = useIntegrationSettings();

  // State for assets and loading
  const [assets, setAssets] = useState<PexelsAPIImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    selectedAssetId
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [colorFilter, setColorFilter] = useState<string>("");
  const [orientationFilter, setOrientationFilter] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [localeFilter, setLocaleFilter] = useState<string>("");

  const [page, setPage] = useState(1);
  const [error, setError] = useState<Error | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 24;
  const offset = (page - 1) * itemsPerPage;

  // Create filters configuration object
  const filters = {
    orientation: {
      value: orientationFilter,
      onChange: setOrientationFilter,
      enabled: true,
    },
    color: {
      value: colorFilter,
      onChange: setColorFilter,
      enabled: true,
    },
    size: {
      value: sizeFilter,
      onChange: setSizeFilter,
      enabled: true,
    },
    locale: {
      value: localeFilter,
      onChange: setLocaleFilter,
      enabled: true,
    },
  };

  // Ref to track if search is in progress
  const isSearching = useRef(false);

  // Create skeleton items for loading state
  const skeletonItems = Array.from({ length: itemsPerPage }).map((_, index) => (
    <AssetGridItemSkeleton key={`skeleton-${index}`} />
  ));

  // Function to fetch assets with pagination
  const fetchAssets = useCallback(
    async (query: string, pageNumber: number): Promise<void> => {
      if (!integrationSettings?.apiKey) {
        setError(new Error("API key is not configured"));
        return;
      }

      if (isSearching.current) return;
      isSearching.current = true;

      try {
        setLoading(true);
        setError(null);

        let results;
        if (query) {
          // Search for assets with filters
          const filterOptions = {
            page: pageNumber,
            perPage: itemsPerPage,
            color: colorFilter || undefined,
            orientation: orientationFilter || undefined,
            size: sizeFilter || undefined,
            locale: localeFilter || undefined,
          };

          // Log for debugging
          console.log("Searching with filters:", {
            query,
            ...filterOptions,
          });

          results = await searchAssets(
            integrationSettings.apiKey,
            query,
            filterOptions
          );
        } else {
          // Get featured assets - don't use filters here as the API doesn't support them
          results = await getFeaturedAssets(integrationSettings.apiKey, {
            page: pageNumber,
            perPage: itemsPerPage,
          });
        }

        // Always set assets directly, never append
        setAssets(results.photos);

        // Update pagination state
        setTotalResults(results.totalResults);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
      } finally {
        setLoading(false);
        isSearching.current = false;
      }
    },
    [
      integrationSettings?.apiKey,
      colorFilter,
      orientationFilter,
      sizeFilter,
      localeFilter,
      itemsPerPage,
    ]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newOffset: number) => {
      const newPage = Math.floor(newOffset / itemsPerPage) + 1;
      setPage(newPage);
      fetchAssets(searchQuery, newPage);
    },
    [fetchAssets, itemsPerPage, searchQuery]
  );

  // Handler for search
  const handleSearch = useCallback(
    (query: string) => {
      // Only update if the query has changed to avoid unnecessary re-renders
      if (query !== searchQuery) {
        setSearchQuery(query);
        setPage(1);
        fetchAssets(query, 1);
      }
    },
    [fetchAssets, searchQuery]
  );

  // Initial load
  useEffect(() => {
    if (integrationSettings?.apiKey) {
      fetchAssets(initialSearchQuery, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrationSettings?.apiKey]);

  // Fetch a specific asset if selectedAssetId changes
  useEffect(() => {
    const fetchSelectedAsset = async () => {
      if (
        selectedAssetId &&
        !assets.some((asset) => asset.id.toString() === selectedAssetId) &&
        integrationSettings?.apiKey
      ) {
        try {
          setLoading(true);
          const asset = await getAssetById(
            integrationSettings.apiKey,
            parseInt(selectedAssetId, 10)
          );
          if (asset) {
            setSelectedId(asset.id.toString());
          }
        } catch (err) {
          console.error("Error fetching selected asset:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSelectedAsset();
  }, [assets, selectedAssetId, integrationSettings?.apiKey]);

  // Handler for asset selection
  const handleAssetSelect = useCallback(
    (asset: PexelsAPIImage) => {
      setSelectedId(asset.id.toString());
      if (onAssetSelect) {
        onAssetSelect(mapImageToUniformAsset(asset));
      }
    },
    [onAssetSelect]
  );

  // Modified useEffect for handling filter changes
  useEffect(() => {
    // Only trigger search when filters change and we have an active search query
    // Don't run on initial render or when searchQuery is empty
    if (searchQuery) {
      // Debounce filter changes to avoid too many API calls
      const handler = setTimeout(() => {
        setPage(1);
        fetchAssets(searchQuery, 1);
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [
    colorFilter,
    orientationFilter,
    sizeFilter,
    localeFilter,
    searchQuery,
    fetchAssets,
  ]);

  // Render empty state
  if (!loading && assets.length === 0 && !error) {
    return (
      <Container>
        <div className="sticky top-0 z-10 bg-white pb-4">
          {mode === "library" && <AssetLibraryHeader />}
          <SearchBar
            initialSearchQuery={searchQuery}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            onSearchChange={(q: string) => {}}
            filters={filters}
          />
        </div>
        <EmptyState
          title="No assets found"
          description={
            searchQuery
              ? `No assets matching '${searchQuery}' were found. Try a different search term.`
              : "Start by searching for assets or check your API key configuration."
          }
          icon="photo"
        />
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container>
        <div className="sticky top-0 z-10 bg-white pb-4">
          {mode === "library" && <AssetLibraryHeader />}
          <SearchBar
            initialSearchQuery={searchQuery}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            onSearchChange={(q: string) => {}}
            filters={filters}
          />
        </div>
        <ErrorState
          title="Error loading assets"
          description={error.message}
          buttonLabel="Try Again"
          onButtonClick={() => fetchAssets(searchQuery, 1)}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="sticky top-0 z-10 bg-white pb-4">
        {mode === "library" && <AssetLibraryHeader />}
        <SearchBar
          initialSearchQuery={searchQuery}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          onSearchChange={(q: string) => {}}
          filters={filters}
        />
      </div>

      <ObjectGridContainer gridCount={3}>
        {loading
          ? skeletonItems
          : (Array.isArray(assets) ? assets : []).map((asset) => (
              <AssetGridItem
                key={asset.id}
                asset={asset}
                isSelected={asset.id.toString() === selectedId}
                onAssetSelect={() => handleAssetSelect(asset)}
              />
            ))}
      </ObjectGridContainer>

      {!loading && Array.isArray(assets) && assets.length > 0 && (
        <div className="flex justify-center mt-6">
          <Pagination
            limit={itemsPerPage}
            offset={offset}
            total={totalResults || 0}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </Container>
  );
};

// Backward compatibility with the old component name
export const PhotoLibrary = AssetLibrary;
