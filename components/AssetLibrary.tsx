import React, { useState, useEffect } from "react";
import {
  Container,
  Pagination,
  ObjectGridContainer,
} from "@uniformdev/design-system";

import { AssetGridItem } from "./AssetGridItem";
import { VideoGridItem } from "./VideoGridItem";
import { AssetGridItemSkeleton } from "./AssetGridItemSkeleton";
import { VideoGridItemSkeleton } from "./VideoGridItemSkeleton";
import { AssetLibraryHeader } from "./AssetLibraryHeader";
import { SearchBar } from "./SearchBar";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { MediaType } from "../lib/types";

// Import the unified hook and asset selection hook
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";
import { useAssetLibrary } from "../lib/hooks/useAssetLibrary";
import { useAssetSelection } from "../lib/hooks/useAssetSelection";

export interface AssetLibraryProps {
  onAssetSelect?: (asset: any) => void;
  selectedAssetId?: string;
  initialSearchQuery?: string;
  mode?: "parameter" | "library";
  allowedAssetTypes?: string[];
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  selectedAssetId,
  initialSearchQuery = "",
  mode = "library",
  allowedAssetTypes = ["image", "video"],
}) => {
  // Get settings
  const integrationSettings = useIntegrationSettings();
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);

  // Check if the API key is available on first render
  useEffect(() => {
    setApiKeyAvailable(!!integrationSettings?.apiKey);
    if (!integrationSettings?.apiKey) {
      console.error("Pexels API key is not configured");
    }
  }, [integrationSettings?.apiKey]);

  // Check if the component should be enabled for asset parameter mode
  const enabledForAssetParameter =
    mode === "parameter"
      ? allowedAssetTypes?.some(
          (type) => type === "image" || type === "video"
        ) ?? true
      : true;

  // Use our unified asset library hook
  const {
    assets,
    loading,
    error,
    totalResults,
    page,
    searchQuery,
    mediaType,
    handleSearch,
    handleMediaTypeChange,
    handlePageChange,
    fetchAssets,
    filters,
    offset,
    itemsPerPage,
    clearAllFilters,
  } = useAssetLibrary({
    apiKeyAvailable,
    allowedAssetTypes,
    initialSearchQuery,
  });

  // Use our asset selection hook (kept separate as it's a distinct concern)
  const { selectedId, handleAssetSelect } = useAssetSelection({
    selectedAssetId,
    onAssetSelect,
    apiKeyAvailable,
    mediaType,
  });

  // Create skeleton items for loading state
  const skeletonItems = Array.from({ length: itemsPerPage }).map((_, index) =>
    mediaType === MediaType.Video ? (
      <VideoGridItemSkeleton key={`skeleton-${index}`} />
    ) : (
      <AssetGridItemSkeleton key={`skeleton-${index}`} />
    )
  );

  // Render for unsupported content types
  if (!enabledForAssetParameter) {
    return (
      <Container>
        <div className="sticky top-0 z-10 bg-white pb-4">
          {mode === "library" && <AssetLibraryHeader />}
        </div>
        <EmptyState
          title="Unsupported asset types"
          description="This parameter is configured to only accept asset types that are not supported by the Pexels integration. Pexels only supports image and video asset types."
          icon="photo"
        />
      </Container>
    );
  }

  // Render empty state
  if (!loading && assets.length === 0 && !error) {
    return (
      <Container>
        <div className="sticky top-0 z-10 bg-white pb-4">
          {mode === "library" && <AssetLibraryHeader />}
          <SearchBar
            searchQuery={searchQuery}
            onSearch={handleSearch}
            filters={filters}
            mediaType={mediaType}
            onMediaTypeChange={handleMediaTypeChange}
            allowedAssetTypes={allowedAssetTypes}
            onClearAllFilters={clearAllFilters}
          />
        </div>
        <EmptyState
          title="No assets found"
          description={
            searchQuery
              ? `No ${
                  mediaType === MediaType.Photo ? "photos" : "videos"
                } matching '${searchQuery}' were found. Try a different search term.`
              : mediaType === MediaType.Photo
              ? "Start by searching for photos or wait for featured photos to load."
              : "Start by searching for videos or wait for popular videos to load."
          }
          icon={mediaType === MediaType.Photo ? "photo" : "video"}
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
            searchQuery={searchQuery}
            onSearch={handleSearch}
            filters={filters}
            mediaType={mediaType}
            onMediaTypeChange={handleMediaTypeChange}
            allowedAssetTypes={allowedAssetTypes}
            onClearAllFilters={clearAllFilters}
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

  // Main render with assets
  return (
    <Container>
      <div className="sticky top-0 z-10 bg-white pb-4">
        {mode === "library" && <AssetLibraryHeader />}
        <SearchBar
          searchQuery={searchQuery}
          onSearch={handleSearch}
          filters={filters}
          mediaType={mediaType}
          onMediaTypeChange={handleMediaTypeChange}
          allowedAssetTypes={allowedAssetTypes}
          onClearAllFilters={clearAllFilters}
        />
      </div>

      <ObjectGridContainer gridCount={3}>
        {loading
          ? skeletonItems
          : (Array.isArray(assets) ? assets : []).map((asset) => {
              // Render either PhotoGridItem or VideoGridItem based on asset type
              if ("video_files" in asset) {
                // It's a video
                return (
                  <VideoGridItem
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id.toString() === selectedId}
                    onAssetSelect={handleAssetSelect}
                  />
                );
              } else {
                // It's a photo
                return (
                  <AssetGridItem
                    key={asset.id}
                    asset={asset}
                    isSelected={asset.id.toString() === selectedId}
                    onAssetSelect={handleAssetSelect}
                  />
                );
              }
            })}
      </ObjectGridContainer>

      {/* Only show pagination when there's a search query and results */}
      {!loading && Array.isArray(assets) && assets.length > 0 && (
        <div className="flex justify-center mt-6 flex-col items-center">
          <Pagination
            limit={itemsPerPage}
            offset={offset}
            total={totalResults || 0}
            onPageChange={(limit: number, newOffset: number) => {
              const newPage = Math.floor(newOffset / limit) + 1;
              handlePageChange(newPage);
            }}
          />
          <div className="text-xs text-gray-500 mt-2">
            Page {page} of {Math.ceil((totalResults || 0) / itemsPerPage)} |
            Total: {totalResults || 0} items
          </div>
        </div>
      )}
    </Container>
  );
};
