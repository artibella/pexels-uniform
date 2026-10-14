export type IntegrationSettings = {
  apiKey?: string;
  assetsPerPage?: number;
  addAuthorCredits?: boolean;
  /** Offers "Add to Uniform Asset Library"; needs identity delegation on the deployment (default: off) */
  enableAssetImport?: boolean;
};

// Media type enum
export enum MediaType {
  Photo = "photo",
  Video = "video",
}

// Image size options
export const PEXELS_IMAGE_SIZES = [
  "original",
  "large2x",
  "large",
  "medium",
  "small",
  "portrait",
  "landscape",
  "tiny",
] as const;

export type PexelsImageSize = (typeof PEXELS_IMAGE_SIZES)[number];

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

// Video-specific types
export type PexelsVideoFile = {
  id: number;
  // null for some files
  quality: "hd" | "sd" | "uhd" | null;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
};

export type PexelsVideoPicture = {
  id: number;
  picture: string;
  nr: number;
};

// Structure of a video from the Pexels API
export type PexelsAPIVideo = {
  id: number;
  width: number;
  height: number;
  url: string; // URL to the video page
  image: string; // URL to a screenshot of the video
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
};
