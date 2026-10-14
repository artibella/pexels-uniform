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

  // A new object whenever any parameter changes (retryCount is only a dependency)
  const request = useMemo(
    () => ({ client, mediaType, searchQuery, page, itemsPerPage, filters }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, mediaType, searchQuery, page, itemsPerPage, filters, retryCount]
  );

  // The settled result and the request it belongs to. The request is loading
  // until its own result arrives, so the empty state doesn't flash before the
  // first fetch, and the previous assets stay on screen meanwhile
  const [state, setState] = useState({
    request: null as typeof request | null,
    assets: [] as (PexelsAPIImage | PexelsAPIVideo)[],
    error: null as Error | null,
    totalResults: 0,
  });

  // Every parameter change starts a new request and aborts the previous one,
  // so the results on screen always match the latest parameters
  useEffect(() => {
    const { client, mediaType, searchQuery, page, itemsPerPage, filters } =
      request;
    if (!client) return;

    const controller = new AbortController();

    fetchMediaPage(
      client,
      { mediaType, query: searchQuery, page, perPage: itemsPerPage, filters },
      { signal: controller.signal }
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setState({
          request,
          assets: result.assets,
          totalResults: result.totalResults,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          request,
          assets: [],
          totalResults: 0,
          error:
            err instanceof Error ? err : new Error("Unknown error occurred"),
        });
      });

    return () => controller.abort();
  }, [request]);

  const settled = state.request === request;

  // Called by both the debounced input and Enter, often with the same text,
  // so only an actual change of query resets the page and filters
  const handleSearch = useCallback(
    (query: string) => {
      const nextQuery = query.trim();
      if (nextQuery === searchQuery) return;
      setSearchQuery(nextQuery);
      // Filters only apply to searches, so clear them with the query
      if (!nextQuery) {
        setFilters(EMPTY_FILTERS);
      }
      setPage(1);
    },
    [searchQuery]
  );

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
    assets: client ? state.assets : [],
    loading: Boolean(client) && !settled,
    error: settled ? state.error : null,
    totalResults: client ? state.totalResults : 0,
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
