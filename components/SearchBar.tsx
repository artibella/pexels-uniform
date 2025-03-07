import React, { useEffect, useState, useRef } from "react";
import { HorizontalRhythm, Button, Icon } from "@uniformdev/design-system";
import Search from "./Search";
import OrientationFilter from "./OrientationFilter";
import ColorFilter from "./ColorFilter";
import SizeFilter from "./SizeFilter";
import LocaleFilter from "./LocaleFilter";

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
}

// Filter component mapping with type definition
const FILTER_COMPONENTS: Record<string, React.ComponentType<any>> = {
  orientation: OrientationFilter,
  color: ColorFilter,
  size: SizeFilter,
  locale: LocaleFilter,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
  initialSearchQuery = "",
  filters = {},
}) => {
  const [query, setQuery] = useState(initialSearchQuery || searchQuery || "");
  const [showFilters, setShowFilters] = useState(false);

  // Add a ref to track if filters were manually toggled
  const manuallyToggled = useRef(false);

  // Create an array of filter entries to render
  const filterEntries = Object.entries(filters).filter(
    ([_, filterConfig]) => filterConfig.enabled !== false
  );

  // Check if we have any filters to show AND there's a search query
  // Only show filters when there's a search query since featured photos endpoint doesn't support filters
  const hasFilters = filterEntries.length > 0 && !!query;

  // Auto-show filters only if they haven't been manually toggled
  useEffect(() => {
    if (
      !manuallyToggled.current &&
      query &&
      filterEntries.some(([_, config]) => !!config.value)
    ) {
      setShowFilters(true);
    }
  }, [query, filterEntries]);

  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchQuery, query]);

  // Hide filters if search is cleared, but only if they haven't been manually toggled
  useEffect(() => {
    if (!query) {
      setShowFilters(false);
      // Reset manual toggle tracking when query is cleared
      manuallyToggled.current = false;
    }
  }, [query]);

  const handleQueryChange = (
    e: React.ChangeEvent<HTMLInputElement> | string | any
  ) => {
    // Handle either an event object or direct string value
    const newQuery =
      typeof e === "object" && e !== null && e.target ? e.target.value : e;

    setQuery(newQuery);

    // If query is cleared, reset manual toggle tracking
    if (!newQuery) {
      manuallyToggled.current = false;
    }

    // Directly trigger search on text input (instead of waiting for form submission)
    if (onSearch) {
      onSearch(newQuery);
    } else if (onSearchChange) {
      onSearchChange(newQuery);
    }
  };

  const toggleFilters = () => {
    // Set the manual toggle flag to true to indicate user preference
    manuallyToggled.current = true;
    setShowFilters(!showFilters);
  };

  // Function to clear all active filters
  const clearAllFilters = () => {
    Object.entries(filters).forEach(([_, config]) => {
      if (config.value && config.onChange) {
        config.onChange("");
      }
    });
  };

  return (
    <div className="w-full border-b border-gray-200 pb-2">
      <HorizontalRhythm gap="base" className="py-2 items-center">
        <Search
          value={query}
          onSearchTextChanged={handleQueryChange}
          placeholder={`Search photos...`}
          className="w-96"
          aria-label={`Search photos`}
          autoFocus={true}
        />

        {/* Filter toggle button - only show if we have filters AND there's a search query */}
        {hasFilters && (
          <Button
            type="button"
            buttonType="tertiaryOutline"
            onClick={toggleFilters}
            title="Toggle filters"
            size="xl"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
            <Icon icon={showFilters ? "close" : "filter-add"} />
          </Button>
        )}
      </HorizontalRhythm>

      {/* Show active filter summary when filters are hidden but active */}
      {!showFilters &&
        hasFilters &&
        filterEntries.some(([_, config]) => !!config.value) && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <span className="font-medium">Active filters: </span>
            {filterEntries
              .filter(([_, config]) => !!config.value)
              .map(([type, config]) => {
                // Get the label for the selected filter value
                let label = config.value;

                // For color filter, make it more readable
                if (type === "color" && config.value) {
                  label = config.value.replace("_", " ");
                }

                return (
                  <span key={type} className="mr-2">
                    {type}: <span className="font-medium">{label}</span>
                  </span>
                );
              })}
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
        )}

      {/* Filters row - only show when toggled on and we have filters AND there's a search query */}
      {hasFilters && (
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
              {filterEntries.map(([filterType, filterConfig]) => {
                const FilterComponent = FILTER_COMPONENTS[filterType];

                // Skip if component doesn't exist for this filter type
                if (!FilterComponent) {
                  console.warn(
                    `No filter component found for type: ${filterType}`
                  );
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
