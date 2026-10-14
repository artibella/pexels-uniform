import React, { useState } from "react";
import { HorizontalRhythm, Button, Icon } from "@uniformdev/design-system";
import Search, { SEARCH_INPUT_NAME } from "./Search";
import MediaTypeSelector from "./MediaTypeSelector";
import { FilterSelect } from "./FilterSelect";
import { MediaFilters } from "../lib/pexels/fetchMediaPage";
import { MediaType } from "../lib/types";

interface FilterConfig {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
}

interface SearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  filters: Record<keyof MediaFilters, FilterConfig>;
  mediaType: MediaType;
  onMediaTypeChange: (mediaType: MediaType) => void;
  allowedAssetTypes: string[];
  onClearAllFilters: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearch,
  filters,
  mediaType,
  onMediaTypeChange,
  allowedAssetTypes,
  onClearAllFilters,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Filters only apply to searches, and color only to photos
  const enabledFilters = (
    Object.entries(filters) as [keyof MediaFilters, FilterConfig][]
  ).filter(([, config]) => config.enabled);
  const activeFilterCount = enabledFilters.filter(([, config]) => config.value).length;
  const mediaLabel = mediaType === MediaType.Photo ? "photos" : "videos";

  // The search input debounces its own text, so on Enter read the live value
  // from the form instead of the last debounced searchQuery
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get(SEARCH_INPUT_NAME);
    onSearch(typeof query === "string" ? query : "");
  };

  return (
    <div className="w-full border-b border-gray-200 pb-2">
      <form onSubmit={handleSubmit}>
        <HorizontalRhythm gap="base" className="py-2 items-center">
          <MediaTypeSelector
            value={mediaType}
            onChange={onMediaTypeChange}
            allowedTypes={allowedAssetTypes}
          />

          <Search
            defaultValue={searchQuery}
            onSearchTextChanged={onSearch}
            placeholder={`Search ${mediaLabel}...`}
            className="w-96"
            aria-label={`Search ${mediaLabel}`}
            autoFocus
          />

          {enabledFilters.length > 0 && (
            <Button
              type="button"
              buttonType="unimportant"
              onClick={() => setShowFilters((show) => !show)}
              aria-expanded={showFilters}
              size="xl"
            >
              <Icon icon={showFilters ? "close" : "math-plus"} color="gray" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          )}
        </HorizontalRhythm>
      </form>

      {!showFilters && activeFilterCount > 0 && (
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-bold">
            {activeFilterCount}{" "}
            {activeFilterCount === 1 ? "active filter" : "active filters"}
          </span>
          <Button
            type="button"
            buttonType="ghostDestructive"
            onClick={onClearAllFilters}
            size="sm"
            className="ml-2"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Only rendered while shown, so hidden selects can't receive keyboard focus */}
      {showFilters && enabledFilters.length > 0 && (
        <div className="pt-2">
          <HorizontalRhythm gap="base" className="flex-wrap items-center">
            {enabledFilters.map(([filterType, config]) => (
              <FilterSelect
                key={filterType}
                filterType={filterType}
                value={config.value}
                onChange={config.onChange}
              />
            ))}
          </HorizontalRhythm>
        </div>
      )}
    </div>
  );
};
