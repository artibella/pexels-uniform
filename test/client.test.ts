import { describe, expect, it, vi } from "vitest";
import { createPexelsClient, PexelsApiError } from "../lib/pexels/client";
import { jsonResponse, photo, video } from "./fixtures";

const photosBody = { photos: [photo], total_results: 1, page: 1, per_page: 12 };

function setup(response: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) => response());
  let time = 1_000_000;
  const client = createPexelsClient("test-key", {
    fetch: fetchMock as unknown as typeof fetch,
    now: () => time,
  });
  const requestedUrl = (call = 0) => new URL(String(fetchMock.mock.calls[call][0]));
  return {
    client,
    fetchMock,
    requestedUrl,
    advanceTime: (ms: number) => (time += ms),
  };
}

describe("createPexelsClient", () => {
  it("sends the API key and maps a photo search response", async () => {
    const { client, fetchMock, requestedUrl } = setup(() => jsonResponse(photosBody));

    const result = await client.searchPhotos({ query: "rocks", page: 2, perPage: 12 });

    expect(result).toEqual({ photos: [photo], totalResults: 1 });
    expect(requestedUrl().pathname).toBe("/v1/search");
    expect(requestedUrl().searchParams.get("page")).toBe("2");
    expect(requestedUrl().searchParams.get("per_page")).toBe("12");
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ Authorization: "test-key" });
  });

  it("encodes special characters in the query", async () => {
    const { client, requestedUrl } = setup(() => jsonResponse(photosBody));

    await client.searchPhotos({ query: "salt & pepper #1" });

    expect(requestedUrl().searchParams.get("query")).toBe("salt & pepper #1");
    expect(requestedUrl().searchParams.has("pepper #1")).toBe(false);
  });

  it("leaves out empty and undefined parameters", async () => {
    const { client, requestedUrl } = setup(() => jsonResponse(photosBody));

    await client.searchPhotos({ query: "sea", color: "", orientation: undefined });

    expect([...requestedUrl().searchParams.keys()]).toEqual(["query"]);
  });

  it("uses the video endpoints", async () => {
    const { client, requestedUrl } = setup(() =>
      jsonResponse({ videos: [video], total_results: 5 })
    );

    const result = await client.popularVideos({ page: 1 });
    await client.searchVideos({ query: "forest" });

    expect(result).toEqual({ videos: [video], totalResults: 5 });
    expect(requestedUrl(0).pathname).toBe("/videos/popular");
    expect(requestedUrl(1).pathname).toBe("/videos/search");
  });

  it.each([
    [401, "unauthorized"],
    [403, "unauthorized"],
    [404, "not-found"],
    [500, "http"],
  ])("turns HTTP %i into a %s error", async (status, kind) => {
    const { client } = setup(() => jsonResponse({}, { status }));

    await expect(client.curatedPhotos()).rejects.toMatchObject({
      name: "PexelsApiError",
      kind,
      status,
    });
  });

  it("reports rate limiting with the reset time from the headers", async () => {
    const { client } = setup(() =>
      jsonResponse(
        {},
        {
          status: 429,
          headers: {
            "X-Ratelimit-Limit": "200",
            "X-Ratelimit-Remaining": "0",
            "X-Ratelimit-Reset": "1760000000",
          },
        }
      )
    );

    const error = await client.curatedPhotos().catch((e) => e);

    expect(error).toBeInstanceOf(PexelsApiError);
    expect(error.kind).toBe("rate-limited");
    expect(error.rateLimit).toEqual({ limit: 200, remaining: 0, reset: 1760000000 });
    expect(error.message).toContain("resets at");
  });

  it("records the rate limit from successful responses", async () => {
    const { client } = setup(() =>
      jsonResponse(photosBody, {
        headers: {
          "X-Ratelimit-Limit": "200",
          "X-Ratelimit-Remaining": "150",
          "X-Ratelimit-Reset": "1760000000",
        },
      })
    );

    expect(client.rateLimit).toBeUndefined();
    await client.curatedPhotos();
    expect(client.rateLimit?.remaining).toBe(150);
  });

  it("turns a failed request into a network error", async () => {
    const { client } = setup(() => {
      throw new TypeError("Failed to fetch");
    });

    await expect(client.curatedPhotos()).rejects.toMatchObject({ kind: "network" });
  });

  it("rethrows aborts unchanged so callers can ignore them", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("Aborted", "AbortError");
    const { client } = setup(() => {
      controller.abort();
      throw abortError;
    });

    await expect(
      client.curatedPhotos({}, { signal: controller.signal })
    ).rejects.toBe(abortError);
  });

  it("serves repeated requests from the cache until it expires", async () => {
    const { client, fetchMock, advanceTime } = setup(() => jsonResponse(photosBody));

    await client.curatedPhotos({ page: 1 });
    await client.curatedPhotos({ page: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await client.curatedPhotos({ page: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    advanceTime(5 * 60 * 1000 + 1);
    await client.curatedPhotos({ page: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not cache errors", async () => {
    const responses = [jsonResponse({}, { status: 500 }), jsonResponse(photosBody)];
    const { client, fetchMock } = setup(() => responses.shift()!);

    await expect(client.curatedPhotos()).rejects.toBeInstanceOf(PexelsApiError);
    await expect(client.curatedPhotos()).resolves.toEqual({ photos: [photo], totalResults: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
