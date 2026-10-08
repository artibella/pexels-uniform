import { describe, expect, it, vi } from "vitest";
import { clampPerPage, fetchMediaPage, MediaFilters } from "../lib/pexels/fetchMediaPage";
import { PexelsClient } from "../lib/pexels/client";
import { MediaType } from "../lib/types";
import { photo, video } from "./fixtures";

const noFilters: MediaFilters = { color: "", orientation: "", size: "", locale: "" };
const filters: MediaFilters = {
  color: "red",
  orientation: "landscape",
  size: "large",
  locale: "de-DE",
};

function fakeClient() {
  const photoPage = { photos: [photo], totalResults: 10 };
  const videoPage = { videos: [video], totalResults: 20 };
  return {
    searchPhotos: vi.fn(async () => photoPage),
    curatedPhotos: vi.fn(async () => photoPage),
    searchVideos: vi.fn(async () => videoPage),
    popularVideos: vi.fn(async () => videoPage),
  };
}

const asClient = (client: ReturnType<typeof fakeClient>) =>
  client as unknown as PexelsClient;

describe("fetchMediaPage", () => {
  it("shows curated photos without a query and ignores filters", async () => {
    const client = fakeClient();

    const result = await fetchMediaPage(asClient(client), {
      mediaType: MediaType.Photo,
      query: "",
      page: 3,
      perPage: 12,
      filters,
    });

    expect(result).toEqual({ assets: [photo], totalResults: 10 });
    expect(client.curatedPhotos).toHaveBeenCalledWith({ page: 3, perPage: 12 }, undefined);
    expect(client.searchPhotos).not.toHaveBeenCalled();
  });

  it("shows popular videos without a query", async () => {
    const client = fakeClient();

    const result = await fetchMediaPage(asClient(client), {
      mediaType: MediaType.Video,
      query: "",
      page: 1,
      perPage: 12,
      filters: noFilters,
    });

    expect(result).toEqual({ assets: [video], totalResults: 20 });
    expect(client.popularVideos).toHaveBeenCalled();
  });

  it("searches photos with all filters", async () => {
    const client = fakeClient();
    const signal = new AbortController().signal;

    await fetchMediaPage(
      asClient(client),
      { mediaType: MediaType.Photo, query: "sea", page: 1, perPage: 12, filters },
      { signal }
    );

    expect(client.searchPhotos).toHaveBeenCalledWith(
      {
        query: "sea",
        page: 1,
        perPage: 12,
        color: "red",
        orientation: "landscape",
        size: "large",
        locale: "de-DE",
      },
      { signal }
    );
  });

  it("searches videos without the color filter", async () => {
    const client = fakeClient();

    await fetchMediaPage(asClient(client), {
      mediaType: MediaType.Video,
      query: "sea",
      page: 1,
      perPage: 12,
      filters,
    });

    expect(client.searchVideos).toHaveBeenCalledWith(
      expect.not.objectContaining({ color: expect.anything() }),
      undefined
    );
  });

  it("caps the page size at the Pexels maximum", async () => {
    const client = fakeClient();

    await fetchMediaPage(asClient(client), {
      mediaType: MediaType.Photo,
      query: "",
      page: 1,
      perPage: 500,
      filters: noFilters,
    });

    expect(client.curatedPhotos).toHaveBeenCalledWith({ page: 1, perPage: 80 }, undefined);
  });
});

describe("clampPerPage", () => {
  it.each([
    [12, 12],
    [0, 1],
    [-5, 1],
    [81, 80],
    [12.6, 13],
    [Number.NaN, 1],
  ])("clamps %d to %d", (input, expected) => {
    expect(clampPerPage(input)).toBe(expected);
  });
});
