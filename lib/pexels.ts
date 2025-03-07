import { createClient, PhotosWithTotalResults, ErrorResponse } from "pexels";
import { PexelsAPIImage } from "./types";

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
 * Search for assets based on a query
 * @param apiKey - Used only for fallback if client isn't initialized yet
 */
export const searchAssets = async (
  apiKey: string,
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
    // The apiKey parameter is kept for backward compatibility
    let client;
    try {
      client = getClient();
    } catch (e) {
      // Fallback initialization if client isn't initialized yet
      initializeClient(apiKey);
      client = getClient();
    }

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
 * Get featured/curated assets
 * @param apiKey - Used only for fallback if client isn't initialized yet
 */
export const getFeaturedAssets = async (
  apiKey: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: string;
    color?: string;
  } = {}
): Promise<{ photos: PexelsAPIImage[]; totalResults: number }> => {
  try {
    // Get the client - it should already be initialized at app startup
    // The apiKey parameter is kept for backward compatibility
    let client;
    try {
      client = getClient();
    } catch (e) {
      // Fallback initialization if client isn't initialized yet
      initializeClient(apiKey);
      client = getClient();
    }

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
    console.error("Error getting featured assets:", error);
    return { photos: [], totalResults: 0 };
  }
};

/**
 * Get a single asset by ID
 * @param apiKey - Used only for fallback if client isn't initialized yet
 */
export const getAssetById = async (
  apiKey: string,
  id: number
): Promise<PexelsAPIImage | null> => {
  try {
    // Get the client - it should already be initialized at app startup
    // The apiKey parameter is kept for backward compatibility
    let client;
    try {
      client = getClient();
    } catch (e) {
      // Fallback initialization if client isn't initialized yet
      initializeClient(apiKey);
      client = getClient();
    }

    const photo = (await client.photos.show({
      id,
    })) as unknown as PexelsAPIImage;
    return photo;
  } catch (error) {
    console.error(`Error getting asset with ID ${id}:`, error);
    return null;
  }
};

/**
 * Make a direct API call to Pexels
 * This is useful for endpoints not covered by the client
 */
export const makeApiCall = async (url: string, apiKey: string) => {
  // For direct API calls, we don't use the client instance
  // since we're making a custom fetch request
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });
  return response.json();
};
