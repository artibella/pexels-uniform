export type IntegrationSettings = {
  apiKey?: string;
  assetsPerPage?: number;
  addAuthorCredits?: boolean;
};

// Media type enum
export enum MediaType {
  Photo = "photo",
  Video = "video",
}

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

// Video-specific types
export type PexelsVideoFile = {
  id: number;
  quality: "hd" | "sd";
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
