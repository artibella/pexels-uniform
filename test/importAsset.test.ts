import { describe, expect, it, vi } from "vitest";
import { FILE_MAX_SIZE, FILE_READY_STATE } from "@uniformdev/files";
import {
  deterministicUuid,
  ImportDependencies,
  ImportError,
  importPexelsAsset,
} from "../lib/server/importAsset";
import type { ImportRequest } from "../lib/importTypes";
import { photo, video } from "./fixtures";

const projectId = "5b3e5f2a-1c4d-4e8f-9a0b-1c2d3e4f5a6b";
const params: ImportRequest = { projectId, kind: "photo", pexelsId: photo.id, variant: "large" };
const expectedAssetId = deterministicUuid(`${projectId}:pexels:photo:2014422:large`);

const notFound = () => Object.assign(new Error("Not found"), { statusCode: 404 });

const savedAsset = {
  _id: expectedAssetId,
  type: "image",
  fields: {
    title: { type: "text", value: "Brown Rocks During Golden Hour" },
    url: { type: "text", value: "https://img.uniform.global/p/abc.jpeg" },
    custom: { type: "object", value: { sourceId: "2014422" } },
  },
};

function setup({
  existingAsset = false,
  leftoverFile,
  contentLength = "1024",
  fileUrlHost,
}: {
  existingAsset?: boolean;
  leftoverFile?: { id: string; state: number };
  contentLength?: string;
  fileUrlHost?: string;
} = {}) {
  let assetSaved = existingAsset;
  const pexelsPhoto = fileUrlHost
    ? { ...photo, src: { ...photo.src, large: `https://${fileUrlHost}/photo.jpg` } }
    : photo;

  const assetClient = {
    get: vi.fn(async () => {
      if (!assetSaved) throw notFound();
      return { asset: savedAsset };
    }),
    save: vi.fn(async () => {
      assetSaved = true;
    }),
  };
  const fileClient = {
    get: vi.fn(async (options: { id?: string; sourceId?: string }) => {
      if (options.sourceId) {
        if (!leftoverFile) throw notFound();
        return leftoverFile;
      }
      return { id: options.id, state: FILE_READY_STATE };
    }),
    insert: vi.fn(async () => ({
      id: "new-file-id",
      method: "PUT" as const,
      uploadUrl: "https://upload.uniform.example/new-file-id",
    })),
  };
  const fetch = vi.fn(async (url: string | URL | Request) => {
    if (String(url).startsWith("https://upload.uniform.example")) {
      return new Response(null, { status: 200 });
    }
    return new Response("image-bytes", {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": contentLength },
    });
  });
  const pexels = {
    getPhoto: vi.fn(async () => pexelsPhoto),
    getVideo: vi.fn(async () => video),
  };

  const deps = {
    assetClient,
    fileClient,
    pexels,
    fetch: fetch as unknown as typeof globalThis.fetch,
    now: () => new Date("2026-10-14T12:00:00Z"),
    sleep: async () => undefined,
  } as unknown as ImportDependencies;

  return { deps, assetClient, fileClient, fetch, pexels };
}

describe("deterministicUuid", () => {
  it("is stable and shaped like a v5 UUID", () => {
    const id = deterministicUuid("a");
    expect(id).toBe(deterministicUuid("a"));
    expect(id).not.toBe(deterministicUuid("b"));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("importPexelsAsset", () => {
  it("uploads the selected size and creates an attributed asset", async () => {
    const { deps, assetClient, fileClient, fetch } = setup();

    const result = await importPexelsAsset(deps, params);

    expect(fetch).toHaveBeenCalledWith(photo.src.large);
    expect(fileClient.insert).toHaveBeenCalledWith({
      name: "brown-rocks-during-golden-hour-by-joey-farina-large.jpg",
      size: 1024,
      mediaType: "image/jpeg",
      width: undefined,
      height: undefined,
      sourceId: "pexels:photo:2014422:large",
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://upload.uniform.example/new-file-id",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "image/jpeg", "Content-Length": "1024" },
      })
    );

    const [[saved]] = assetClient.save.mock.calls as unknown as [[{ asset: Record<string, any> }]];
    expect(saved.asset._id).toBe(expectedAssetId);
    expect(saved.asset.type).toBe("image");
    expect(saved.asset.fields.file).toEqual({ type: "file", value: "new-file-id" });
    expect(saved.asset.fields.description.value).toContain("Photo by Joey Farina on Pexels");
    expect(saved.asset.fields.description.value).toContain(photo.url);

    expect(result.reused).toBe(false);
    expect(result.asset).toMatchObject({ _id: expectedAssetId, _source: "uniform-assets" });
    // custom is only supported on assets from integrations
    expect(result.asset.fields).not.toHaveProperty("custom");
    expect(result.asset.fields.url.value).toBe("https://img.uniform.global/p/abc.jpeg");
  });

  it("reuses an asset imported before without uploading", async () => {
    const { deps, assetClient, fileClient, fetch } = setup({ existingAsset: true });

    const result = await importPexelsAsset(deps, params);

    expect(result.reused).toBe(true);
    expect(result.asset.fields).not.toHaveProperty("custom");
    expect(fetch).not.toHaveBeenCalled();
    expect(fileClient.insert).not.toHaveBeenCalled();
    expect(assetClient.save).not.toHaveBeenCalled();
  });

  it("attaches a finished file left behind by a failed import", async () => {
    const { deps, assetClient, fileClient, fetch } = setup({
      leftoverFile: { id: "leftover-id", state: FILE_READY_STATE },
    });

    await importPexelsAsset(deps, params);

    expect(fetch).not.toHaveBeenCalled();
    expect(fileClient.insert).not.toHaveBeenCalled();
    expect(assetClient.save).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({
          fields: expect.objectContaining({ file: { type: "file", value: "leftover-id" } }),
        }),
      })
    );
  });

  it("uploads under a new source id when the leftover file is unfinished", async () => {
    const { deps, fileClient } = setup({ leftoverFile: { id: "leftover-id", state: 1 } });

    await importPexelsAsset(deps, params);

    expect(fileClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: `pexels:photo:2014422:large:${new Date("2026-10-14T12:00:00Z").getTime()}`,
      })
    );
  });

  it("imports the chosen video file", async () => {
    const { deps, fetch, assetClient } = setup();

    await importPexelsAsset(deps, { projectId, kind: "video", pexelsId: video.id, variant: "2" });

    expect(fetch).toHaveBeenCalledWith(video.video_files[1].link);
    const [[saved]] = assetClient.save.mock.calls as unknown as [[{ asset: Record<string, any> }]];
    expect(saved.asset.type).toBe("video");
    expect(saved.asset.fields.description.value).toContain("Video by Ruvim Miksanskiy on Pexels");
  });

  it("rejects files over the Uniform size limit", async () => {
    const { deps, fileClient } = setup({ contentLength: String(FILE_MAX_SIZE + 1) });

    await expect(importPexelsAsset(deps, params)).rejects.toMatchObject({
      status: 413,
      code: "file_too_large",
    });
    expect(fileClient.insert).not.toHaveBeenCalled();
  });

  it("refuses files that aren't hosted by Pexels", async () => {
    const { deps, fetch } = setup({ fileUrlHost: "attacker.example" });

    await expect(importPexelsAsset(deps, params)).rejects.toBeInstanceOf(ImportError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unknown photo sizes and video files", async () => {
    const { deps } = setup();

    await expect(
      importPexelsAsset(deps, { ...params, variant: "huge" })
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      importPexelsAsset(deps, { projectId, kind: "video", pexelsId: video.id, variant: "999" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("passes Uniform permission errors through", async () => {
    const { deps, assetClient } = setup();
    assetClient.save.mockRejectedValueOnce(
      Object.assign(new Error("Forbidden"), { statusCode: 403 })
    );

    await expect(importPexelsAsset(deps, params)).rejects.toMatchObject({ statusCode: 403 });
  });
});
