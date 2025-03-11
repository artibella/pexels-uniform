import { useState, useEffect, useCallback, useRef } from "react";
import { MediaType, PexelsAPIImage, PexelsAPIVideo } from "../types";
import {
  searchPhotos,
  getCuratedPhotos,
  searchVideos,
  getPopularVideos,
} from "../pexels";

export interface AssetLibraryOptions {
  apiKeyAvailable?: boolean;
  allowedAssetTypes?: string[];
  initialSearchQuery?: string;
  itemsPerPage?: number;
}

// Photo search results interface
interface PhotoSearchResults {
  photos: PexelsAPIImage[];
  totalResults: number;
}

// Video search results interface
interface VideoSearchResults {
  videos: PexelsAPIVideo[];
  totalResults: number;
}

export function useAssetLibrary(options: AssetLibraryOptions) {
  const {
    apiKeyAvailable,
    allowedAssetTypes = ["image", "video"],
    initialSearchQuery = "",
    itemsPerPage = 15,
  } = options;

  // Determine initial media type based on allowed asset types
  const getInitialMediaType = (): MediaType => {
    if (
      allowedAssetTypes.includes("image") &&
      !allowedAssetTypes.includes("video")
    ) {
      return MediaType.Photo;
    }
    if (
      !allowedAssetTypes.includes("image") &&
      allowedAssetTypes.includes("video")
    ) {
      return MediaType.Video;
    }
    return MediaType.Photo; // Default to photo if both are allowed
  };

  // Basic state for the library
  const [mediaType, setMediaType] = useState<MediaType>(getInitialMediaType());
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [page, setPage] = useState(1);

  // Filter states
  const [colorFilter, setColorFilter] = useState("");
  const [orientationFilter, setOrientationFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [localeFilter, setLocaleFilter] = useState("");

  // Results and loading state
  const [state, setState] = useState({
    assets: [] as (PexelsAPIImage | PexelsAPIVideo)[],
    loading: false,
    error: null as Error | null,
    totalResults: 0,
  });

  // Flag to prevent concurrent searches
  const [isSearching, setIsSearching] = useState(false);

  // Track when params change and we need to fetch
  const [shouldFetch, setShouldFetch] = useState(true);

  // Use a ref to keep track of the current state values without causing re-renders
  const stateRef = useRef({
    mediaType,
    searchQuery,
    page,
    colorFilter,
    orientationFilter,
    sizeFilter,
    localeFilter,
  });

  // Update the ref whenever these values change
  useEffect(() => {
    stateRef.current = {
      mediaType,
      searchQuery,
      page,
      colorFilter,
      orientationFilter,
      sizeFilter,
      localeFilter,
    };
  }, [
    mediaType,
    searchQuery,
    page,
    colorFilter,
    orientationFilter,
    sizeFilter,
    localeFilter,
  ]);

  // Core fetch function that doesn't depend on state directly
  const fetchAssets = useCallback(async () => {
    if (isSearching) {
      return;
    }

    // Get current state values from ref to avoid dependency issues
    const {
      mediaType: currentMediaType,
      searchQuery: currentQuery,
      page: currentPage,
      colorFilter: currentColorFilter,
      orientationFilter: currentOrientationFilter,
      sizeFilter: currentSizeFilter,
      localeFilter: currentLocaleFilter,
    } = stateRef.current;

    setIsSearching(true);
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // CASE 1: Photos with no search - fetch curated photos (no filters)
      if (currentMediaType === MediaType.Photo && !currentQuery) {
        console.log(`Fetching curated photos (page ${currentPage})`);
        // Curated photos endpoint doesn't support filtering
        const basicOptions = {
          page: currentPage,
          perPage: itemsPerPage,
        };

        const result = await getCuratedPhotos(basicOptions);
        setState((prev) => ({
          ...prev,
          assets: result.photos,
          totalResults: result.totalResults,
          loading: false,
        }));
      }
      // CASE 2: Videos with no search - fetch popular videos (no filters)
      else if (currentMediaType === MediaType.Video && !currentQuery) {
        console.log(`Fetching popular videos (page ${currentPage})`);
        // Popular videos endpoint doesn't support filtering
        const basicOptions = {
          page: currentPage,
          perPage: itemsPerPage,
        };

        const result = await getPopularVideos(basicOptions);
        setState((prev) => ({
          ...prev,
          assets: result.videos,
          totalResults: result.totalResults,
          loading: false,
        }));
      }
      // CASE 3 & 4: With search - apply filters for both photos and videos
      else if (currentQuery) {
        // Prepare filter options for search endpoints (which support filtering)
        const filterOptions: {
          page: number;
          perPage: number;
          orientation?: string;
          size?: string;
          locale?: string;
          color?: string;
        } = {
          page: currentPage,
          perPage: itemsPerPage,
          orientation: currentOrientationFilter || undefined,
          size: currentSizeFilter || undefined,
          locale: currentLocaleFilter || undefined,
        };

        // Add color filter only for photos
        if (currentMediaType === MediaType.Photo) {
          filterOptions.color = currentColorFilter || undefined;
        }

        console.log(
          `Searching ${currentMediaType} with query "${currentQuery}" and filters:`,
          filterOptions
        );

        // CASE 3: Photos with search - fetch photo search results with filters
        if (currentMediaType === MediaType.Photo) {
          const result = await searchPhotos(currentQuery, filterOptions);
          setState((prev) => ({
            ...prev,
            assets: result.photos,
            totalResults: result.totalResults,
            loading: false,
          }));
        }
        // CASE 4: Videos with search - fetch video search results with filters
        else {
          const result = await searchVideos(currentQuery, filterOptions);
          setState((prev) => ({
            ...prev,
            assets: result.videos,
            totalResults: result.totalResults,
            loading: false,
          }));
        }
      }
    } catch (err) {
      console.error(`Error fetching ${currentMediaType}:`, err);
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err : new Error("Unknown error occurred"),
        loading: false,
      }));
    } finally {
      setIsSearching(false);
      setShouldFetch(false); // Mark that we've handled this fetch request
    }
  }, [itemsPerPage, isSearching]);

  // Trigger fetchAssets when shouldFetch is true
  useEffect(() => {
    if (shouldFetch) {
      const timerId = setTimeout(() => {
        fetchAssets();
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timerId);
    }
  }, [shouldFetch, fetchAssets]);

  // Set shouldFetch to true when relevant params change
  useEffect(() => {
    setShouldFetch(true);
  }, [
    mediaType,
    searchQuery,
    page,
    colorFilter,
    orientationFilter,
    sizeFilter,
    localeFilter,
  ]);

  // Simple search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    // Reset all filters when search is cleared
    if (!query) {
      setColorFilter("");
      setOrientationFilter("");
      setSizeFilter("");
      setLocaleFilter("");
    }

    setPage(1); // Reset to page 1 when search changes
  }, []);

  // Simple page change handler
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Media type change handler
  const handleMediaTypeChange = useCallback((newMediaType: MediaType) => {
    // If switching to videos, clear the color filter
    if (newMediaType === MediaType.Video) {
      setColorFilter("");
    }

    setMediaType(newMediaType);
    setPage(1); // Reset to page 1 when media type changes
  }, []);

  // Generic filter change handler
  const handleFilterChange = useCallback(
    (filterType: string, value: string) => {
      // Set the appropriate filter based on type
      switch (filterType) {
        case "color":
          setColorFilter(value);
          break;
        case "orientation":
          setOrientationFilter(value);
          break;
        case "size":
          setSizeFilter(value);
          break;
        case "locale":
          setLocaleFilter(value);
          break;
      }

      setPage(1); // Reset to page 1 when filters change
    },
    []
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColorFilter("");
    setOrientationFilter("");
    setSizeFilter("");
    setLocaleFilter("");
    setPage(1); // Reset to page 1 when filters are cleared
  }, []);

  // Generate filter config for UI components
  const filterConfig = useCallback(() => {
    // If no search query, all filters should be disabled
    const isSearchActive = searchQuery !== "";

    return {
      orientation: {
        value: orientationFilter,
        onChange: (value: string) => handleFilterChange("orientation", value),
        enabled: isSearchActive, // Only enable when search is active
      },
      color: {
        value: colorFilter,
        onChange: (value: string) => handleFilterChange("color", value),
        enabled: isSearchActive && mediaType === MediaType.Photo, // Only enable for photos with search
      },
      size: {
        value: sizeFilter,
        onChange: (value: string) => handleFilterChange("size", value),
        enabled: isSearchActive, // Only enable when search is active
      },
      locale: {
        value: localeFilter,
        onChange: (value: string) => handleFilterChange("locale", value),
        enabled: isSearchActive, // Only enable when search is active
      },
    };
  }, [
    mediaType,
    colorFilter,
    orientationFilter,
    sizeFilter,
    localeFilter,
    handleFilterChange,
    searchQuery,
  ]);

  return {
    // State
    assets: state.assets,
    loading: state.loading,
    error: state.error,
    totalResults: state.totalResults,
    page,
    searchQuery,
    mediaType,

    // Handlers
    handleSearch,
    handleFilterChange,
    handleMediaTypeChange,
    handlePageChange,
    fetchAssets: (query: string, pageToFetch: number) => {
      handleSearch(query);
      setPage(pageToFetch);
    },
    clearAllFilters,

    // Filters
    filters: filterConfig(),

    // Computed
    offset: (page - 1) * itemsPerPage,
    itemsPerPage: itemsPerPage,
  };
}
