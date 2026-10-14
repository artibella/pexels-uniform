import { describe, expect, it } from "vitest";
import { describePhotoImport, describeVideoImport } from "../lib/attribution";
import { photo, video } from "./fixtures";

const importedAt = new Date("2026-10-14T12:00:00Z");

describe("describePhotoImport", () => {
  it("credits the photographer and links back to Pexels", () => {
    const source = describePhotoImport(photo, "large", importedAt);

    expect(source.title).toBe("Brown Rocks During Golden Hour");
    expect(source.description).toBe(
      [
        "Brown Rocks During Golden Hour",
        "Photo by Joey Farina on Pexels",
        "Photographer: https://www.pexels.com/@joey",
        "Source: https://www.pexels.com/photo/brown-rocks-during-golden-hour-2014422/",
        "Pexels photo 2014422 · Large · Imported 2026-10-14",
      ].join("\n")
    );
  });

  it("copies the selected size and keys it per size", () => {
    const source = describePhotoImport(photo, "medium", importedAt);

    expect(source.fileUrl).toBe(photo.src.medium);
    expect(source.sourceKey).toBe("pexels:photo:2014422:medium");
    expect(source.filename).toBe("brown-rocks-during-golden-hour-by-joey-farina-medium.jpg");
    expect(source.assetType).toBe("image");
    // Resized renditions have no known dimensions
    expect(source.width).toBeUndefined();
  });

  it("includes the dimensions of the original", () => {
    const source = describePhotoImport(photo, "original", importedAt);

    expect(source.width).toBe(3024);
    expect(source.height).toBe(3024);
    expect(source.description).toContain("Original (3024×3024)");
  });

  it("falls back to a credit title without alt text", () => {
    const source = describePhotoImport({ ...photo, alt: "" }, "small", importedAt);

    expect(source.title).toBe("Photo by Joey Farina");
    expect(source.description.split("\n")[0]).toBe("Photo by Joey Farina on Pexels");
  });
});

describe("describeVideoImport", () => {
  it("credits the videographer and describes the chosen file", () => {
    const file = video.video_files[1];
    const source = describeVideoImport(video, file, importedAt);

    expect(source).toMatchObject({
      sourceKey: "pexels:video:1448735:2",
      fileUrl: file.link,
      filename: "pexels-video-1448735-1920x1012.mp4",
      mediaType: "video/mp4",
      width: 1920,
      height: 1012,
      assetType: "video",
      title: "Video by Ruvim Miksanskiy",
    });
    expect(source.description).toBe(
      [
        "Video by Ruvim Miksanskiy on Pexels",
        "Videographer: https://www.pexels.com/@digitech",
        "Source: https://www.pexels.com/video/video-of-forest-1448735/",
        "Pexels video 1448735 · 1920×1012 HD · Imported 2026-10-14",
      ].join("\n")
    );
  });
});
