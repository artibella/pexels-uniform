import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { PexelsAPIImage, PexelsAPIVideo, PexelsVideoFile } from "./types";
import { formatDuration } from "./utils";

/** Used as `_source` when the location doesn't provide its integration source ID */
export const DEFAULT_ASSET_SOURCE = "pexels";

export type MappingOptions = {
  /** Uniform integration source ID from the location metadata */
  source?: string;
  /** Adds the photographer credit to the asset description */
  includeAuthorCredits?: boolean;
};

export function photoAttribution(photo: PexelsAPIImage): string {
  return `Photo by ${photo.photographer} on Pexels`;
}

export function videoAttribution(video: PexelsAPIVideo): string {
  return `Video by ${video.user.name} on Pexels`;
}

/**
 * Picks the widest HD file, falling back to the widest file of any quality.
 * Returns undefined when the video has no files.
 */
export function pickBestVideoFile(
  files: PexelsVideoFile[] | undefined
): PexelsVideoFile | undefined {
  if (!files?.length) return undefined;
  const hdFiles = files.filter((file) => file.quality === "hd");
  const candidates = hdFiles.length ? hdFiles : files;
  return candidates.reduce((best, current) =>
    (current.width ?? 0) > (best.width ?? 0) ? current : best
  );
}

function imageMediaType(url: string): string {
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

/**
 * Maps a Pexels photo to a Uniform asset.
 * The url is the original file so width and height describe it; the Pexels CDN
 * resizes on request (e.g. `?auto=compress&w=800`), and the fixed Pexels
 * renditions are kept in `custom`.
 */
export function mapImageToUniformAsset(
  photo: PexelsAPIImage,
  { source = DEFAULT_ASSET_SOURCE, includeAuthorCredits = true }: MappingOptions = {}
): AssetParamValueItem {
  const attribution = photoAttribution(photo);
  const description = [photo.alt, includeAuthorCredits ? attribution : undefined]
    .filter(Boolean)
    .join(". ");

  return {
    _id: `pexels-image-${photo.id}`,
    _source: source,
    type: "image",
    fields: {
      id: { type: "text", value: photo.id.toString() },
      url: { type: "text", value: photo.src.original },
      // Uniform has no separate alt field; frontends use the title as alt text
      title: {
        type: "text",
        value: photo.alt || `Photo by ${photo.photographer}`,
      },
      description: { type: "text", value: description },
      mediaType: { type: "text", value: imageMediaType(photo.src.original) },
      width: { type: "number", value: photo.width },
      height: { type: "number", value: photo.height },
      custom: {
        type: "object",
        value: {
          sourceId: photo.id.toString(),
          alt: photo.alt,
          attribution,
          avgColor: photo.avg_color,
          pexelsUrl: photo.url,
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          photographerId: photo.photographer_id,
          pexelsOriginalUrl: photo.src.original,
          photoTinyUrl: photo.src.tiny,
          photoSmallUrl: photo.src.small,
          photoMediumUrl: photo.src.medium,
          photoLargeUrl: photo.src.large,
          photoLarge2xUrl: photo.src.large2x,
          photoPortraitUrl: photo.src.portrait,
          photoLandscapeUrl: photo.src.landscape,
        },
      },
    },
  };
}

/**
 * Maps a Pexels video to a Uniform asset using its best quality file.
 * Throws when the video has no files; check with pickBestVideoFile first.
 */
export function mapVideoToUniformAsset(
  video: PexelsAPIVideo,
  { source = DEFAULT_ASSET_SOURCE, includeAuthorCredits = true }: MappingOptions = {}
): AssetParamValueItem {
  const videoFile = pickBestVideoFile(video.video_files);
  if (!videoFile) {
    throw new Error(`Pexels video ${video.id} has no downloadable files`);
  }
  const attribution = videoAttribution(video);

  return {
    _id: `pexels-video-${video.id}`,
    _source: source,
    type: "video",
    fields: {
      id: { type: "text", value: video.id.toString() },
      url: { type: "text", value: videoFile.link },
      title: { type: "text", value: `Video by ${video.user.name}` },
      description: {
        type: "text",
        value: includeAuthorCredits ? attribution : "",
      },
      mediaType: { type: "text", value: videoFile.file_type || "video/mp4" },
      width: { type: "number", value: videoFile.width },
      height: { type: "number", value: videoFile.height },
      custom: {
        type: "object",
        value: {
          sourceId: video.id.toString(),
          attribution,
          pexelsUrl: video.url,
          // Kept for assets stored by earlier versions; same as pexelsUrl
          videoOriginalUrl: video.url,
          videoThumbnailUrl: video.image,
          fileType: videoFile.file_type,
          fps: videoFile.fps,
          quality: videoFile.quality,
          duration: video.duration,
          durationFormatted: formatDuration(video.duration),
          authorName: video.user.name,
          authorProfileUrl: video.user.url,
        },
      },
    },
  };
}
