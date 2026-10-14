import React from "react";
import {
  Callout,
  Container,
  Pagination,
  ObjectGridContainer,
} from "@uniformdev/design-system";
import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";

import { AssetGridItem } from "./AssetGridItem";
import { VideoGridItem } from "./VideoGridItem";
import { GridItemSkeleton } from "./GridItemSkeleton";
import { AssetLibraryHeader, PexelsAttribution } from "./AssetLibraryHeader";
import { SearchBar } from "./SearchBar";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { MediaType } from "../lib/types";
import { DEFAULT_ASSETS_PER_PAGE } from "../lib/constants";
import { clampPerPage } from "../lib/pexels/fetchMediaPage";
import { selectionKeyForPexelsAsset } from "../lib/selection";

import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";
import { useAssetLibrary } from "../lib/hooks/useAssetLibrary";
import { useAssetSelection } from "../lib/hooks/useAssetSelection";

export interface AssetLibraryProps {
  onAssetSelect?: (asset: AssetParamValueItem) => void;
  /** Selection keys (see lib/selection.ts) of the currently selected assets */
  selectedKeys?: string[];
  /** Uniform integration source ID, stored as the picked asset's `_source` */
  source?: string;
  initialSearchQuery?: string;
  mode?: "parameter" | "library";
  allowedAssetTypes?: string[];
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  selectedKeys = [],
  source,
  initialSearchQuery = "",
  mode = "library",
  allowedAssetTypes = ["image", "video"],
}) => {
  const integrationSettings = useIntegrationSettings();
  const itemsPerPage = clampPerPage(
    integrationSettings?.assetsPerPage ?? DEFAULT_ASSETS_PER_PAGE
  );

  // Pexels only provides images and videos
  const enabledForAssetParameter =
    mode !== "parameter" ||
    allowedAssetTypes.some((type) => type === "image" || type === "video");

  const {
    assets,
    loading,
    error,
    totalResults,
    page,
    searchQuery,
    mediaType,
    missingApiKey,
    handleSearch,
    handleMediaTypeChange,
    handlePageChange,
    retry,
    filters,
    offset,
    clearAllFilters,
  } = useAssetLibrary({
    allowedAssetTypes,
    initialSearchQuery,
    itemsPerPage,
  });

  const { handleAssetSelect } = useAssetSelection({ onAssetSelect, source });

  const searchBar = (
    <SearchBar
      searchQuery={searchQuery}
      onSearch={handleSearch}
      filters={filters}
      mediaType={mediaType}
      onMediaTypeChange={handleMediaTypeChange}
      allowedAssetTypes={allowedAssetTypes}
      onClearAllFilters={clearAllFilters}
    />
  );

  const renderLayout = (content: React.ReactNode, showSearch = true) => (
    <Container>
      <div className="sticky top-0 z-10 bg-white pb-4">
        {/* Pexels requires a prominent link to Pexels wherever API results are shown */}
        {mode === "library" ? <AssetLibraryHeader /> : <PexelsAttribution />}
        {showSearch && searchBar}
      </div>
      {content}
    </Container>
  );

  if (!enabledForAssetParameter) {
    return renderLayout(
      <EmptyState
        title="Unsupported asset types"
        description="This parameter is configured to only accept asset types that are not supported by the Pexels integration. Pexels only supports image and video asset types."
        icon="photo"
      />,
      false
    );
  }

  if (missingApiKey) {
    return renderLayout(
      <Callout title="Pexels API key missing" type="caution">
        Add a Pexels API key in the Pexels integration settings to browse
        photos and videos. You can get a free key at pexels.com/api.
      </Callout>,
      false
    );
  }

  if (error) {
    return renderLayout(
      <ErrorState
        title="Error loading assets"
        description={error.message}
        buttonLabel="Try Again"
        onButtonClick={retry}
      />
    );
  }

  if (!loading && assets.length === 0) {
    return renderLayout(
      <EmptyState
        title="No assets found"
        description={
          searchQuery
            ? `No ${
                mediaType === MediaType.Photo ? "photos" : "videos"
              } matching '${searchQuery}' were found. Try a different search term.`
            : `Pexels returned no ${
                mediaType === MediaType.Photo ? "featured photos" : "popular videos"
              }. Try searching instead.`
        }
        icon={mediaType === MediaType.Photo ? "photo" : "video"}
      />
    );
  }

  const skeletonItems = Array.from({ length: itemsPerPage }).map((_, index) => (
    <GridItemSkeleton key={`skeleton-${index}`} />
  ));

  return renderLayout(
    <>
      <ObjectGridContainer gridCount={4}>
        {loading
          ? skeletonItems
          : assets.map((asset) => {
              const isSelected = selectedKeys.includes(
                selectionKeyForPexelsAsset(asset)
              );
              return "video_files" in asset ? (
                <VideoGridItem
                  key={asset.id}
                  asset={asset}
                  isSelected={isSelected}
                  onAssetSelect={handleAssetSelect}
                />
              ) : (
                <AssetGridItem
                  key={asset.id}
                  asset={asset}
                  isSelected={isSelected}
                  onAssetSelect={handleAssetSelect}
                />
              );
            })}
      </ObjectGridContainer>

      {!loading && assets.length > 0 && (
        <div className="flex justify-center mt-6 flex-col items-center">
          <Pagination
            limit={itemsPerPage}
            offset={offset}
            total={totalResults}
            onPageChange={(limit: number, newOffset: number) => {
              handlePageChange(Math.floor(newOffset / limit) + 1);
            }}
          />
          <div className="text-xs text-gray-500 mt-2">
            Page {page} of {Math.ceil(totalResults / itemsPerPage)} | Total:{" "}
            {totalResults} items
          </div>
        </div>
      )}
    </>
  );
};
