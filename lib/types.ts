import { AssetLibraryLocationMetadata } from "@uniformdev/mesh-sdk-react";

export type IntegrationSettings = {
  apiKey?: string;
  assetsPerPage?: number;
  addPhotoCredits?: boolean;
};

// Selection metadata types
export type AssetSelectionMetadata = {
  limit: number;
  query?: string; // Optional search query
  color?: string; // Optional color filter
  orientation?: string; // Optional orientation filter (landscape, portrait, square)
  apiKey: string; // API key
};

export type AssetLibraryMetadata = AssetSelectionMetadata &
  AssetLibraryLocationMetadata;

// Image size options
export type PexelsImageSize =
  | "original"
  | "large"
  | "large2x"
  | "medium"
  | "small"
  | "portrait"
  | "landscape"
  | "tiny";

// API source structure for different sizes
export type PexelsAPISource = {
  original: string;
  large: string;
  large2x: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
};

// Structure of a photo from the Pexels API
export type PexelsAPIImage = {
  id: number;
  width: number;
  height: number;
  url: string; // URL to the photo page
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: PexelsAPISource;
  alt: string;
};

// Pexels specific types
export type PexelsSelectionMetadata = {
  limit: number;
  query?: string; // Optional search query
  color?: string; // Optional color filter
  orientation?: string; // Optional orientation filter (landscape, portrait, square)
  apiKey: string; // Pexels API key
};

export type PexelsLibraryMetadata = PexelsSelectionMetadata &
  AssetLibraryLocationMetadata;

// Keep the Unsplash types for backward compatibility during migration
// These can be removed once migration is complete
export type UnsplashSelectionMetadata = {
  limit: number;
  query?: string; // Optional search query
  color?: string; // Optional color filter
  orientation?: string; // Optional orientation filter (landscape, portrait, squarish)
  clientId: string; // Unsplash API access key
};

export type UnsplashLibraryMetadata = UnsplashSelectionMetadata &
  AssetLibraryLocationMetadata;

export type UnsplashImageSize =
  | "raw"
  | "full"
  | "regular"
  | "small"
  | "thumb"
  | "small_s3";

export type UnsplashAPIUserCollection = {
  id: string;
  title: string;
  description: string;
  published_at: string;
  last_collected_at: string;
};

export type UnsplashAPIImage = {
  id: string;
  slug: string | null;
  alternative_slugs: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  likes: number;
  liked_by_user: boolean;
  current_user_collections: object[];

  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };

  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url?: string | null;
    bio?: string | null;
    location?: string | null;
    total_likes?: number;
    total_photos?: number;
    total_collections?: number;
    instagram_username?: string | null;
    twitter_username?: string | null;
    profile_image?: {
      small: string;
      medium: string;
      large: string;
    };
    links?: {
      self: string;
      html: string;
      photos: string;
      likes: string;
      portfolio: string;
    };
  };
};
