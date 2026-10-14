import { describe, expect, it, vi } from "vitest";
import { verifyApiKey } from "../lib/pexels/verifyApiKey";
import { jsonResponse } from "./fixtures";

const respondWith = (response: () => Response) =>
  vi.fn(async () => response()) as unknown as typeof fetch;

describe("verifyApiKey", () => {
  it("accepts a key Pexels answers for", async () => {
    const fetch = respondWith(() => jsonResponse({ photos: [], total_results: 0 }));

    await expect(verifyApiKey("good-key", { fetch })).resolves.toEqual({
      status: "valid",
    });
  });

  it("rejects an empty key without calling Pexels", async () => {
    const fetch = respondWith(() => jsonResponse({}));

    await expect(verifyApiKey("  ", { fetch })).resolves.toMatchObject({
      status: "invalid",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a key Pexels refuses", async () => {
    const fetch = respondWith(() => jsonResponse({}, { status: 401 }));

    await expect(verifyApiKey("bad-key", { fetch })).resolves.toMatchObject({
      status: "invalid",
    });
  });

  it("can't verify a key while rate limited", async () => {
    const fetch = respondWith(() => jsonResponse({}, { status: 429 }));

    await expect(verifyApiKey("good-key", { fetch })).resolves.toMatchObject({
      status: "unverified",
    });
  });
});
