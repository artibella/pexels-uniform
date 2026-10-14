import { describe, expect, it } from "vitest";
import {
  mapImageToUniformAsset,
  mapVideoToUniformAsset,
  pickBestVideoFile,
} from "../lib/mapping";
import { formatDuration } from "../lib/utils";
import { photo, video, videoFile } from "./fixtures";

describe("mapImageToUniformAsset", () => {
  it("stores the original file with matching dimensions", () => {
    const asset = mapImageToUniformAsset(photo, { source: "source-123" });

    expect(asset).toMatchObject({
      _id: "pexels-image-2014422",
      _source: "source-123",
      type: "image",
    });
    expect(asset.fields.url.value).toBe(photo.src.original);
    expect(asset.fields.width?.value).toBe(3024);
    expect(asset.fields.height?.value).toBe(3024);
    expect(asset.fields.id?.value).toBe("2014422");
    expect(asset.fields.mediaType?.value).toBe("image/jpeg");
  });

  it("gives the same _id each time the photo is picked", () => {
    expect(mapImageToUniformAsset(photo)._id).toBe(mapImageToUniformAsset(photo)._id);
  });

  it("falls back to a default source", () => {
    expect(mapImageToUniformAsset(photo)._source).toBe("pexels");
  });

  it("uses the alt text as title and adds the credit to the description", () => {
    const asset = mapImageToUniformAsset(photo);

    expect(asset.fields.title?.value).toBe("Brown Rocks During Golden Hour");
    expect(asset.fields.description?.value).toBe(
      "Brown Rocks During Golden Hour. Photo by Joey Farina on Pexels"
    );
  });

  it("leaves the credit out of the description when disabled but keeps it in custom", () => {
    const asset = mapImageToUniformAsset(photo, { includeAuthorCredits: false });

    expect(asset.fields.description?.value).toBe("Brown Rocks During Golden Hour");
    expect(asset.fields.custom?.value).toMatchObject({
      attribution: "Photo by Joey Farina on Pexels",
      photographer: "Joey Farina",
      pexelsUrl: photo.url,
      avgColor: "#978E82",
    });
  });

  it("doesn't start the description with a separator when there is no alt text", () => {
    const asset = mapImageToUniformAsset({ ...photo, alt: "" });

    expect(asset.fields.title?.value).toBe("Photo by Joey Farina");
    expect(asset.fields.description?.value).toBe("Photo by Joey Farina on Pexels");
  });

  it("keeps the selection key fields used by earlier versions", () => {
    expect(mapImageToUniformAsset(photo).fields.custom?.value.sourceId).toBe("2014422");
  });
});

describe("mapVideoToUniformAsset", () => {
  it("uses the best file for url, dimensions and media type", () => {
    const asset = mapVideoToUniformAsset(video, { source: "source-123" });

    expect(asset).toMatchObject({
      _id: "pexels-video-1448735",
      _source: "source-123",
      type: "video",
    });
    expect(asset.fields.url.value).toBe(
      "https://videos.pexels.com/video-files/1448735/hd-1920.mp4"
    );
    expect(asset.fields.width?.value).toBe(1920);
    expect(asset.fields.height?.value).toBe(1012);
    expect(asset.fields.mediaType?.value).toBe("video/mp4");
    expect(asset.fields.custom?.value.durationFormatted).toBe("0:32");
  });

  it("keeps the credit in custom when it is left out of the description", () => {
    const asset = mapVideoToUniformAsset(video, { includeAuthorCredits: false });

    expect(asset.fields.description?.value).toBe("");
    expect(asset.fields.custom?.value.attribution).toBe(
      "Video by Ruvim Miksanskiy on Pexels"
    );
  });

  it("throws a clear error for a video without files", () => {
    expect(() => mapVideoToUniformAsset({ ...video, video_files: [] })).toThrow(
      "has no downloadable files"
    );
  });
});

describe("pickBestVideoFile", () => {
  it("prefers the widest HD file", () => {
    expect(pickBestVideoFile(video.video_files)?.id).toBe(2);
  });

  it("falls back to the widest file when there is no HD file", () => {
    const files = [
      videoFile({ id: 1, width: 426 }),
      videoFile({ id: 2, width: 960 }),
      videoFile({ id: 3, width: 640 }),
    ];
    expect(pickBestVideoFile(files)?.id).toBe(2);
  });

  it("returns undefined when there are no files", () => {
    expect(pickBestVideoFile([])).toBeUndefined();
    expect(pickBestVideoFile(undefined)).toBeUndefined();
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [32, "0:32"],
    [61, "1:01"],
    [59.6, "1:00"],
    [undefined, "0:00"],
  ])("formats %s as %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
