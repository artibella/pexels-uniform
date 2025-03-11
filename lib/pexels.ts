import { createClient, PhotosWithTotalResults, ErrorResponse } from "pexels";
import { PexelsAPIImage, PexelsAPIVideo } from "./types";

// ======== CLIENT MANAGEMENT ========

// Define the client type, using any for simplicity to avoid tight coupling with the Pexels library types
export type PexelsClient = {
  photos: {
    search: (params: any) => Promise<any>;
    curated: (params?: any) => Promise<any>;
    show: (params: { id: number }) => Promise<any>;
    random: () => Promise<any>;
  };
  videos: {
    search: (params: any) => Promise<any>;
    popular: (params?: any) => Promise<any>;
    show: (params: { id: number }) => Promise<any>;
  };
  collections: {
    featured: (params?: any) => Promise<any>;
    collection: (params: { id: string }) => Promise<any>;
    media: (params: { id: string } & any) => Promise<any>;
  };
};

// Client instance that will be initialized
let clientInstance: PexelsClient | null = null;

/**
 * Initialize the Pexels client with the API key
 * This should be called at application startup
 */
export function initializeClient(apiKey: string): void {
  if (!clientInstance && apiKey) {
    clientInstance = createClient(apiKey) as unknown as PexelsClient;
    console.log("Pexels client initialized");
  }
}

/**
 * Get the initialized Pexels client
 * Throws an error if the client hasn't been initialized
 */
export function getClient(): PexelsClient {
  if (!clientInstance) {
    throw new Error(
      "Pexels client not initialized. Call initializeClient first with a valid API key."
    );
  }
  return clientInstance;
}

/**
 * Reset the client instance
 * Useful for testing or when the API key changes
 */
export function resetClient(): void {
  clientInstance = null;
}

// ======== API FUNCTIONS ========

/**
 * Search for photos based on a query
 */
export const searchPhotos = async (
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: string;
    color?: string;
    size?: string;
    locale?: string;
  } = {}
): Promise<{ photos: PexelsAPIImage[]; totalResults: number }> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    const {
      perPage = 15,
      page = 1,
      orientation,
      color,
      size,
      locale,
    } = options;

    // Build search parameters
    const params: any = {
      query,
      per_page: perPage,
      page,
    };

    // Add optional parameters if provided
    if (orientation) params.orientation = orientation;
    if (color) params.color = color;
    if (size) params.size = size;
    if (locale) params.locale = locale;

    // Execute search
    const response = (await client.photos.search(
      params
    )) as PhotosWithTotalResults;

    return {
      photos: response.photos as unknown as PexelsAPIImage[],
      totalResults: response.total_results,
    };
  } catch (error) {
    console.error("Error searching assets:", error);
    return { photos: [], totalResults: 0 };
  }
};

/**
 * Get curated photos
 */
export const getCuratedPhotos = async (
  options: {
    perPage?: number;
    page?: number;
    orientation?: string;
    color?: string;
  } = {}
): Promise<{ photos: PexelsAPIImage[]; totalResults: number }> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    const { perPage = 15, page = 1, orientation, color } = options;

    // Build parameters
    const params: any = {
      per_page: perPage,
      page,
    };

    // Add optional parameters if provided
    if (orientation) params.orientation = orientation;
    if (color) params.color = color;

    // Execute curated photos request
    const response = (await client.photos.curated(
      params
    )) as PhotosWithTotalResults;

    return {
      photos: response.photos as unknown as PexelsAPIImage[],
      totalResults: response.total_results,
    };
  } catch (error) {
    console.error("Error getting curated photos:", error);
    return { photos: [], totalResults: 0 };
  }
};

/**
 * Get a single photo by ID
 */
export const getPhotoById = async (
  id: number
): Promise<PexelsAPIImage | null> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    // Execute show request
    const response = await client.photos.show({ id });

    return response as unknown as PexelsAPIImage;
  } catch (error) {
    console.error(`Error getting photo with ID ${id}:`, error);
    return null;
  }
};

/**
 * Search for videos based on a query
 */
export const searchVideos = async (
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: string;
    size?: string;
    locale?: string;
    minDuration?: number;
    maxDuration?: number;
  } = {}
): Promise<{ videos: PexelsAPIVideo[]; totalResults: number }> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    const {
      perPage = 15,
      page = 1,
      orientation,
      size,
      locale,
      minDuration,
      maxDuration,
    } = options;

    // Build search parameters
    const params: any = {
      query,
      per_page: perPage,
      page,
    };

    // Add optional parameters if provided
    if (orientation) params.orientation = orientation;
    if (size) params.size = size;
    if (locale) params.locale = locale;
    if (minDuration) params.min_duration = minDuration;
    if (maxDuration) params.max_duration = maxDuration;

    // Execute search
    const response = await client.videos.search(params);

    return {
      videos: response.videos as PexelsAPIVideo[],
      totalResults: response.total_results,
    };
  } catch (error) {
    console.error("Error searching videos:", error);
    return { videos: [], totalResults: 0 };
  }
};

/**
 * Get popular videos
 */
export const getPopularVideos = async (
  options: {
    perPage?: number;
    page?: number;
    minWidth?: number;
    minHeight?: number;
    minDuration?: number;
    maxDuration?: number;
  } = {}
): Promise<{ videos: PexelsAPIVideo[]; totalResults: number }> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    const {
      perPage = 15,
      page = 1,
      minWidth,
      minHeight,
      minDuration,
      maxDuration,
    } = options;

    // Build parameters
    const params: any = {
      per_page: perPage,
      page,
    };

    // Add optional parameters if provided
    if (minWidth) params.min_width = minWidth;
    if (minHeight) params.min_height = minHeight;
    if (minDuration) params.min_duration = minDuration;
    if (maxDuration) params.max_duration = maxDuration;

    // Execute popular videos request
    const response = await client.videos.popular(params);

    return {
      videos: response.videos as PexelsAPIVideo[],
      totalResults: response.total_results,
    };
  } catch (error) {
    console.error("Error getting popular videos:", error);
    return { videos: [], totalResults: 0 };
  }
};

/**
 * Get a single video by ID
 */
export const getVideoById = async (
  id: number
): Promise<PexelsAPIVideo | null> => {
  try {
    // Get the client - it should already be initialized at app startup
    const client = getClient();

    // Execute show request
    const response = await client.videos.show({ id });

    return response as PexelsAPIVideo;
  } catch (error) {
    console.error(`Error getting video with ID ${id}:`, error);
    return null;
  }
};

/**
 * Make a direct API call to the Pexels API
 * Used for endpoints not covered by the official client
 */
export const makeApiCall = async (url: string) => {
  try {
    // Get the client to ensure it's initialized
    getClient();

    // For direct API calls, we get the API key from the environment
    // or we can add a method to extract the API key from the client instance if needed
    const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";

    if (!apiKey) {
      throw new Error("API key is not available for direct API call");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    return response.json();
  } catch (error) {
    console.error(`Error making API call to ${url}:`, error);
    return null;
  }
};
