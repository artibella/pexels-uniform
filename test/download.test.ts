import { describe, expect, it } from "vitest";
import { toAttachmentUrl } from "../lib/download";
import { photo } from "./fixtures";

describe("toAttachmentUrl", () => {
  it("adds the dl parameter and keeps the existing size parameters", () => {
    const url = new URL(toAttachmentUrl(photo.src.medium, "brown rocks.jpg"));

    expect(url.searchParams.get("dl")).toBe("brown rocks.jpg");
    expect(url.searchParams.get("h")).toBe("350");
    expect(url.searchParams.get("auto")).toBe("compress");
  });

  it("works for URLs without a query string", () => {
    expect(toAttachmentUrl(photo.src.original, "rocks.jpg")).toBe(
      `${photo.src.original}?dl=rocks.jpg`
    );
  });
});
