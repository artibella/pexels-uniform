import { PexelsAPIImage, PexelsAPIVideo } from "../types";

const API_HOST = "https://api.pexels.com";

// Pexels allows at most 80 results per page
export const MAX_PER_PAGE = 80;

// Identical requests (pagination back and forth, toggling filters) are served
// from memory to stay well inside the hourly Pexels rate limit
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;

export type RateLimit = {
  limit: number;
  remaining: number;
  /** Unix timestamp (seconds) when the limit resets */
  reset: number;
};

export type PexelsErrorKind =
  | "unauthorized"
  | "rate-limited"
  | "not-found"
  | "network"
  | "http";

export class PexelsApiError extends Error {
  constructor(
    message: string,
    readonly kind: PexelsErrorKind,
    readonly status?: number,
    readonly rateLimit?: RateLimit
  ) {
    super(message);
    this.name = "PexelsApiError";
  }
}

export type PageParams = {
  page?: number;
  perPage?: number;
};

export type PhotoSearchParams = PageParams & {
  query: string;
  orientation?: string;
  size?: string;
  color?: string;
  locale?: string;
};

export type VideoSearchParams = Omit<PhotoSearchParams, "color">;

export type RequestOptions = {
  signal?: AbortSignal;
};

export type PhotoPage = { photos: PexelsAPIImage[]; totalResults: number };
export type VideoPage = { videos: PexelsAPIVideo[]; totalResults: number };

type QueryParams = Record<string, string | number | undefined>;

type PhotosResponse = { photos: PexelsAPIImage[]; total_results: number };
type VideosResponse = { videos: PexelsAPIVideo[]; total_results: number };

export type CreatePexelsClientOptions = {
  fetch?: typeof fetch;
  now?: () => number;
};

export type PexelsClient = ReturnType<typeof createPexelsClient>;

export function createPexelsClient(
  apiKey: string,
  options: CreatePexelsClientOptions = {}
) {
  // Keep fetch unbound from the options object; browsers throw
  // "Illegal invocation" when fetch is called as a method of another object
  const fetchFn = options.fetch ?? globalThis.fetch;
  const now = options.now ?? Date.now;
  const cache = new Map<string, { expires: number; data: unknown }>();
  let lastRateLimit: RateLimit | undefined;

  async function get<T>(
    path: string,
    params: QueryParams,
    { signal }: RequestOptions = {}
  ): Promise<T> {
    const url = buildUrl(path, params);

    const cached = cache.get(url);
    if (cached && cached.expires > now()) {
      return cached.data as T;
    }

    let response: Response;
    try {
      response = await fetchFn(url, {
        headers: { Authorization: apiKey },
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new PexelsApiError(
        "Could not reach Pexels. Check your network connection and try again.",
        "network"
      );
    }

    lastRateLimit = readRateLimit(response.headers) ?? lastRateLimit;

    if (!response.ok) {
      throw errorFromStatus(response.status, lastRateLimit);
    }

    const data = (await response.json()) as T;

    cache.set(url, { expires: now() + CACHE_TTL_MS, data });
    if (cache.size > CACHE_MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }

    return data;
  }

  const toPhotoPage = (response: PhotosResponse): PhotoPage => ({
    photos: response.photos ?? [],
    totalResults: response.total_results ?? 0,
  });

  const toVideoPage = (response: VideosResponse): VideoPage => ({
    videos: response.videos ?? [],
    totalResults: response.total_results ?? 0,
  });

  return {
    async searchPhotos(
      { query, page, perPage, orientation, size, color, locale }: PhotoSearchParams,
      requestOptions?: RequestOptions
    ): Promise<PhotoPage> {
      const response = await get<PhotosResponse>(
        "/v1/search",
        { query, page, per_page: perPage, orientation, size, color, locale },
        requestOptions
      );
      return toPhotoPage(response);
    },

    async curatedPhotos(
      { page, perPage }: PageParams = {},
      requestOptions?: RequestOptions
    ): Promise<PhotoPage> {
      const response = await get<PhotosResponse>(
        "/v1/curated",
        { page, per_page: perPage },
        requestOptions
      );
      return toPhotoPage(response);
    },

    getPhoto(id: number, requestOptions?: RequestOptions) {
      return get<PexelsAPIImage>(`/v1/photos/${id}`, {}, requestOptions);
    },

    async searchVideos(
      { query, page, perPage, orientation, size, locale }: VideoSearchParams,
      requestOptions?: RequestOptions
    ): Promise<VideoPage> {
      const response = await get<VideosResponse>(
        "/videos/search",
        { query, page, per_page: perPage, orientation, size, locale },
        requestOptions
      );
      return toVideoPage(response);
    },

    async popularVideos(
      { page, perPage }: PageParams = {},
      requestOptions?: RequestOptions
    ): Promise<VideoPage> {
      const response = await get<VideosResponse>(
        "/videos/popular",
        { page, per_page: perPage },
        requestOptions
      );
      return toVideoPage(response);
    },

    getVideo(id: number, requestOptions?: RequestOptions) {
      return get<PexelsAPIVideo>(`/videos/videos/${id}`, {}, requestOptions);
    },

    /** Rate limit reported by the most recent response, when Pexels exposes it */
    get rateLimit(): RateLimit | undefined {
      return lastRateLimit;
    },
  };
}

function buildUrl(path: string, params: QueryParams): string {
  const url = new URL(path, API_HOST);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function readRateLimit(headers: Headers): RateLimit | undefined {
  const limit = headers.get("X-Ratelimit-Limit");
  const remaining = headers.get("X-Ratelimit-Remaining");
  const reset = headers.get("X-Ratelimit-Reset");
  if (limit === null || remaining === null || reset === null) {
    return undefined;
  }
  return {
    limit: Number(limit),
    remaining: Number(remaining),
    reset: Number(reset),
  };
}

function errorFromStatus(
  status: number,
  rateLimit: RateLimit | undefined
): PexelsApiError {
  if (status === 401 || status === 403) {
    return new PexelsApiError(
      "Pexels rejected the API key. Check the key in the Pexels integration settings.",
      "unauthorized",
      status
    );
  }
  if (status === 429) {
    const resetsAt = rateLimit?.reset
      ? ` It resets at ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}.`
      : "";
    return new PexelsApiError(
      `The Pexels rate limit for this API key has been reached.${resetsAt}`,
      "rate-limited",
      status,
      rateLimit
    );
  }
  if (status === 404) {
    return new PexelsApiError("Not found on Pexels.", "not-found", status);
  }
  return new PexelsApiError(
    `Pexels request failed with status ${status}. Try again later.`,
    "http",
    status
  );
}
