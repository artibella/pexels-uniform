import { describe, expect, it } from "vitest";
import { mapVideoToUniformAsset, pickBestVideoFile } from "../lib/utils";
import { video, videoFile } from "./fixtures";

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

describe("mapVideoToUniformAsset", () => {
  it("uses the best file for url and dimensions", () => {
    const asset = mapVideoToUniformAsset(video);
    expect(asset.type).toBe("video");
    expect(asset.fields.url.value).toBe(
      "https://videos.pexels.com/video-files/1448735/hd-1920.mp4"
    );
    expect(asset.fields.width?.value).toBe(1920);
    expect(asset.fields.height?.value).toBe(1012);
  });

  it("throws a clear error for a video without files", () => {
    expect(() => mapVideoToUniformAsset({ ...video, video_files: [] })).toThrow(
      "has no downloadable files"
    );
  });
});
