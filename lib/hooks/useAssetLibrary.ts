import { useState, useEffect, useCallback, useMemo } from "react";
import { MediaType, PexelsAPIImage, PexelsAPIVideo } from "../types";
import { DEFAULT_ASSETS_PER_PAGE } from "../constants";
import { fetchMediaPage, MediaFilters } from "../pexels/fetchMediaPage";
import { usePexelsClient } from "./usePexelsClient";

export interface AssetLibraryOptions {
  allowedAssetTypes?: string[];
  initialSearchQuery?: string;
  itemsPerPage?: number;
}

type FilterType = keyof MediaFilters;

const EMPTY_FILTERS: MediaFilters = {
  color: "",
  orientation: "",
  size: "",
  locale: "",
};

function getInitialMediaType(allowedAssetTypes: string[]): MediaType {
  if (
    allowedAssetTypes.includes("video") &&
    !allowedAssetTypes.includes("image")
  ) {
    return MediaType.Video;
  }
  return MediaType.Photo;
}

export function useAssetLibrary(options: AssetLibraryOptions) {
  const {
    allowedAssetTypes = ["image", "video"],
    initialSearchQuery = "",
    itemsPerPage = DEFAULT_ASSETS_PER_PAGE,
  } = options;

  const client = usePexelsClient();

  const [mediaType, setMediaType] = useState<MediaType>(() =>
    getInitialMediaType(allowedAssetTypes)
  );
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<MediaFilters>(EMPTY_FILTERS);
  // Bumped by retry() to refetch with unchanged parameters
  const [retryCount, setRetryCount] = useState(0);

  // Start in the loading state so the empty state doesn't flash before the first fetch
  const [state, setState] = useState({
    assets: [] as (PexelsAPIImage | PexelsAPIVideo)[],
    loading: true,
    error: null as Error | null,
    totalResults: 0,
  });

  // Every parameter change starts a new request and aborts the previous one,
  // so the results on screen always match the latest parameters
  useEffect(() => {
    if (!client) {
      setState({ assets: [], loading: false, error: null, totalResults: 0 });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchMediaPage(
      client,
      { mediaType, query: searchQuery, page, perPage: itemsPerPage, filters },
      { signal: controller.signal }
    )
      .then((result) => {
        setState({
          assets: result.assets,
          totalResults: result.totalResults,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          assets: [],
          totalResults: 0,
          loading: false,
          error:
            err instanceof Error ? err : new Error("Unknown error occurred"),
        }));
      });

    return () => controller.abort();
  }, [client, mediaType, searchQuery, page, itemsPerPage, filters, retryCount]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Filters only apply to searches, so clear them with the query
    if (!query) {
      setFilters(EMPTY_FILTERS);
    }
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleMediaTypeChange = useCallback((newMediaType: MediaType) => {
    // Pexels has no color filter for videos
    if (newMediaType === MediaType.Video) {
      setFilters((prev) => ({ ...prev, color: "" }));
    }
    setMediaType(newMediaType);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (filterType: FilterType, value: string) => {
      setFilters((prev) => ({ ...prev, [filterType]: value }));
      setPage(1);
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const retry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  const filterConfig = useMemo(() => {
    const isSearchActive = searchQuery !== "";
    const filterFor = (filterType: FilterType, enabled: boolean) => ({
      value: filters[filterType],
      onChange: (value: string) => handleFilterChange(filterType, value),
      enabled,
    });

    return {
      orientation: filterFor("orientation", isSearchActive),
      color: filterFor("color", isSearchActive && mediaType === MediaType.Photo),
      size: filterFor("size", isSearchActive),
      locale: filterFor("locale", isSearchActive),
    };
  }, [filters, handleFilterChange, mediaType, searchQuery]);

  return {
    // State
    assets: state.assets,
    loading: state.loading,
    error: state.error,
    totalResults: state.totalResults,
    page,
    searchQuery,
    mediaType,
    missingApiKey: !client,

    // Handlers
    handleSearch,
    handleFilterChange,
    handleMediaTypeChange,
    handlePageChange,
    clearAllFilters,
    retry,

    // Filters
    filters: filterConfig,

    // Computed
    offset: (page - 1) * itemsPerPage,
    itemsPerPage,
  };
}
