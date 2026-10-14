import { PexelsAPIImage, PexelsAPIVideo, PexelsImageSize, PexelsVideoFile } from "./types";
import { imageMediaType, photoAttribution, videoAttribution } from "./mapping";
import { generateFilename, generateVideoFilename, getImageSizeLabels } from "./utils";

/** What an import needs to know about the Pexels file it copies */
export type ImportSource = {
  /** Stable key for this item and resolution, stored as the Uniform file's sourceId */
  sourceKey: string;
  /** The Pexels file to copy */
  fileUrl: string;
  filename: string;
  /** Fallback when the Pexels response has no content type */
  mediaType: string;
  /** Only known for the original photo and for video files */
  width?: number;
  height?: number;
  assetType: "image" | "video";
  title: string;
  /** Carries the Pexels attribution, since imported assets lose their link to Pexels */
  description: string;
};

function importedOn(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Describes a photo import. The description always credits the photographer and
 * links back to Pexels, whatever the author credits setting says: that setting
 * only applies to hot-linked picks, which keep their Pexels metadata.
 */
export function describePhotoImport(
  photo: PexelsAPIImage,
  size: PexelsImageSize,
  importedAt: Date
): ImportSource {
  const isOriginal = size === "original";
  const { label } = getImageSizeLabels(photo)[size];
  const dimensions = isOriginal ? ` (${photo.width}×${photo.height})` : "";
  const fileUrl = photo.src[size];

  const description = [
    photo.alt,
    photoAttribution(photo),
    `Photographer: ${photo.photographer_url}`,
    `Source: ${photo.url}`,
    `Pexels photo ${photo.id} · ${label}${dimensions} · Imported ${importedOn(importedAt)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    sourceKey: `pexels:photo:${photo.id}:${size}`,
    fileUrl,
    filename: generateFilename(photo, size),
    mediaType: imageMediaType(fileUrl),
    width: isOriginal ? photo.width : undefined,
    height: isOriginal ? photo.height : undefined,
    assetType: "image",
    // Uniform has no separate alt field; frontends use the title as alt text
    title: photo.alt || `Photo by ${photo.photographer}`,
    description,
  };
}

/**
 * Describes a video file import. See describePhotoImport for the attribution.
 */
export function describeVideoImport(
  video: PexelsAPIVideo,
  file: PexelsVideoFile,
  importedAt: Date
): ImportSource {
  const quality = file.quality ? ` ${file.quality.toUpperCase()}` : "";

  const description = [
    videoAttribution(video),
    `Videographer: ${video.user.url}`,
    `Source: ${video.url}`,
    `Pexels video ${video.id} · ${file.width}×${file.height}${quality} · Imported ${importedOn(importedAt)}`,
  ].join("\n");

  return {
    sourceKey: `pexels:video:${video.id}:${file.id}`,
    fileUrl: file.link,
    filename: generateVideoFilename(video, file),
    mediaType: file.file_type || "video/mp4",
    width: file.width || undefined,
    height: file.height || undefined,
    assetType: "video",
    title: `Video by ${video.user.name}`,
    description,
  };
}
