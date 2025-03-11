import React, { useState } from "react";
import { HorizontalRhythm, Button, Icon } from "@uniformdev/design-system";
import Search from "./Search";
import OrientationFilter from "./OrientationFilter";
import ColorFilter from "./ColorFilter";
import SizeFilter from "./SizeFilter";
import LocaleFilter from "./LocaleFilter";
import MediaTypeSelector from "./MediaTypeSelector";
import { MediaType } from "../lib/types";

// Define the filter config interface
interface FilterConfig {
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
}

// Define the filters object interface
interface FiltersObject {
  [key: string]: FilterConfig;
}

// Define the SearchBar props interface
interface SearchBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string, isSubmit?: boolean) => void;
  onSearch?: (query: string) => void;
  initialSearchQuery?: string;
  filters?: FiltersObject;
  mediaType?: MediaType;
  onMediaTypeChange?: (mediaType: MediaType) => void;
  allowedAssetTypes?: string[];
  onClearAllFilters?: () => void;
}

// Filter component mapping with type definition
const FILTER_COMPONENTS: Record<string, React.ComponentType<any>> = {
  orientation: OrientationFilter,
  color: ColorFilter,
  size: SizeFilter,
  locale: LocaleFilter,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery = "",
  onSearchChange,
  onSearch,
  initialSearchQuery = "",
  filters = {},
  mediaType = MediaType.Photo,
  onMediaTypeChange,
  allowedAssetTypes = ["image", "video"],
  onClearAllFilters,
}) => {
  // Filter UI state
  const [showFilters, setShowFilters] = useState(false);

  // Get active filters (non-disabled ones)
  const activeFilters = Object.entries(filters).filter(
    ([_, filterConfig]) => filterConfig.enabled !== false
  );

  // Check if any filters are active (have values)
  const hasActiveFilterValues = activeFilters.some(
    ([_, config]) => !!config.value
  );

  // Simple condition: show toggle if we have a query and filters
  const shouldShowFilterToggle = searchQuery && activeFilters.length > 0;

  const handleQueryChange = (
    e: React.ChangeEvent<HTMLInputElement> | string | any
  ) => {
    // Handle either an event object or direct string value
    const newQuery =
      typeof e === "object" && e !== null && e.target ? e.target.value : e;

    // Directly call parent handlers
    if (onSearchChange) {
      onSearchChange(newQuery);
    }

    // Debouncing is handled by the Search component, so we can call onSearch directly
    if (onSearch) {
      onSearch(newQuery);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Always prevent default form submission

    // Only trigger search if we have both a query and an onSearch handler
    if (onSearch && searchQuery) {
      onSearch(searchQuery);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Function to clear all active filters
  const clearAllFilters = () => {
    // If an external handler is provided, use it
    if (onClearAllFilters) {
      onClearAllFilters();
      return;
    }

    // Otherwise use the internal implementation
    Object.keys(filters).forEach((filterKey) => {
      const config = filters[filterKey];
      // Check if this filter has a value and an onChange handler
      if (config.onChange) {
        // Reset the filter value to empty string
        config.onChange("");
      }
    });

    // Optionally, we can log to verify all filters are being processed
    console.log("Clearing all filters");
  };

  const activeFilterCount = activeFilters.filter(
    ([_, config]) => !!config.value
  ).length;

  return (
    <div className="w-full border-b border-gray-200 pb-2">
      <form onSubmit={handleSubmit}>
        <HorizontalRhythm gap="base" className="py-2 items-center">
          {/* Media Type Selector */}
          {typeof onMediaTypeChange === "function" && (
            <MediaTypeSelector
              value={mediaType}
              onChange={onMediaTypeChange}
              allowedTypes={allowedAssetTypes}
            />
          )}

          {/* Search Input */}
          <Search
            value={searchQuery}
            onSearchTextChanged={handleQueryChange}
            placeholder={
              mediaType === MediaType.Photo
                ? "Search photos..."
                : "Search videos..."
            }
            className="w-96"
            aria-label={`Search ${
              mediaType === MediaType.Photo ? "photos" : "videos"
            }`}
            autoFocus={true}
          />

          {/* Filter toggle button - simple condition */}
          {shouldShowFilterToggle && (
            <Button
              type="button"
              buttonType="unimportant"
              onClick={toggleFilters}
              title={showFilters ? "Hide filters" : "Show filters"}
              size="xl"
            >
              <Icon icon={showFilters ? "close" : "math-plus"} color="gray" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          )}
        </HorizontalRhythm>
      </form>

      {/* Show active filter summary when filters are hidden but active */}
      {!showFilters && hasActiveFilterValues && (
        <div className="text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-bold">
              {`${activeFilterCount} `}
              {activeFilterCount === 1 ? "active filter" : "active filters"}
            </span>
            <Button
              type="button"
              buttonType="ghostDestructive"
              onClick={clearAllFilters}
              size="sm"
              className="ml-2"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Filters row - only render when we have activeFilters */}
      {activeFilters.length > 0 && (
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out transform
            ${
              showFilters
                ? "max-h-[200px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-4"
            }
          `}
        >
          <div className="pt-2">
            <HorizontalRhythm gap="base" className="flex-wrap items-center">
              {activeFilters.map(([filterType, filterConfig]) => {
                const FilterComponent = FILTER_COMPONENTS[filterType];

                // Skip if component doesn't exist for this filter type
                if (!FilterComponent) {
                  return null;
                }

                return (
                  <div key={filterType} className="flex items-center">
                    <FilterComponent
                      value={filterConfig.value || ""}
                      onChange={filterConfig.onChange}
                    />
                  </div>
                );
              })}
            </HorizontalRhythm>
          </div>
        </div>
      )}
    </div>
  );
};
