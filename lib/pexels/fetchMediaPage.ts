import { MediaType, PexelsAPIImage, PexelsAPIVideo } from "../types";
import { MAX_PER_PAGE, PexelsClient, RequestOptions } from "./client";

export type MediaFilters = {
  color: string;
  orientation: string;
  size: string;
  locale: string;
};

export type MediaQuery = {
  mediaType: MediaType;
  query: string;
  page: number;
  perPage: number;
  filters: MediaFilters;
};

export type MediaPage = {
  assets: (PexelsAPIImage | PexelsAPIVideo)[];
  totalResults: number;
};

export function clampPerPage(perPage: number): number {
  if (!Number.isFinite(perPage)) return 1;
  return Math.min(MAX_PER_PAGE, Math.max(1, Math.round(perPage)));
}

/**
 * Fetches one page of media for the current library state.
 * Without a query Pexels only offers curated photos / popular videos, which
 * don't support filters, so filters only apply to searches.
 */
export async function fetchMediaPage(
  client: PexelsClient,
  { mediaType, query, page, perPage, filters }: MediaQuery,
  requestOptions?: RequestOptions
): Promise<MediaPage> {
  const pageParams = { page, perPage: clampPerPage(perPage) };
  const searchFilters = {
    orientation: filters.orientation || undefined,
    size: filters.size || undefined,
    locale: filters.locale || undefined,
  };

  if (mediaType === MediaType.Video) {
    const result = query
      ? await client.searchVideos(
          { query, ...pageParams, ...searchFilters },
          requestOptions
        )
      : await client.popularVideos(pageParams, requestOptions);
    return { assets: result.videos, totalResults: result.totalResults };
  }

  const result = query
    ? await client.searchPhotos(
        {
          query,
          ...pageParams,
          ...searchFilters,
          color: filters.color || undefined,
        },
        requestOptions
      )
    : await client.curatedPhotos(pageParams, requestOptions);
  return { assets: result.photos, totalResults: result.totalResults };
}
