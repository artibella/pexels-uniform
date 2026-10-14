import { createHash } from "node:crypto";
import type { AssetClient } from "@uniformdev/assets";
import { FILE_MAX_SIZE, FILE_READY_STATE, type FileClient } from "@uniformdev/files";
import type { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { describePhotoImport, describeVideoImport, ImportSource } from "../attribution";
import type { ImportRequest, ImportResponse } from "../importTypes";
import type { PexelsClient } from "../pexels/client";
import { PEXELS_IMAGE_SIZES, type PexelsImageSize } from "../types";

/** `_source` of assets picked from the Uniform asset library */
export const UNIFORM_ASSETS_SOURCE = "uniform-assets";

// Pexels serves photos and videos from these hosts. Videos used to be served
// from Vimeo, so those links can't be imported.
const ALLOWED_FILE_HOSTS = ["images.pexels.com", "videos.pexels.com"];

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60_000;

/** An import failure with the HTTP status the API route should respond with */
export class ImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ImportError";
  }
}

export type ImportDependencies = {
  fileClient: Pick<FileClient, "get" | "insert">;
  assetClient: Pick<AssetClient, "get" | "save">;
  pexels: Pick<PexelsClient, "getPhoto" | "getVideo">;
  fetch?: typeof fetch;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * Builds a UUID (version 5 layout) from a name, so the same Pexels item and
 * resolution always maps to the same asset id within a project.
 */
export function deterministicUuid(name: string): string {
  const bytes = createHash("sha1").update(name).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/** The HTTP status of a Uniform API client error, if it has one */
export function statusOf(error: unknown): number | undefined {
  const status = (error as { statusCode?: unknown })?.statusCode;
  return typeof status === "number" ? status : undefined;
}

function assertAllowedHost(url: string) {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new ImportError("Pexels returned an invalid file URL.", 502);
  }
  if (!ALLOWED_FILE_HOSTS.includes(hostname)) {
    throw new ImportError("This Pexels file can't be imported.", 422);
  }
}

async function resolveSource(
  pexels: ImportDependencies["pexels"],
  { kind, pexelsId, variant }: ImportRequest,
  importedAt: Date
): Promise<ImportSource> {
  // Look the item up again rather than trusting the browser, so the attribution
  // and the file URL come straight from Pexels
  if (kind === "photo") {
    if (!PEXELS_IMAGE_SIZES.includes(variant as PexelsImageSize)) {
      throw new ImportError(`Unknown photo size "${variant}".`, 400);
    }
    const photo = await pexels.getPhoto(pexelsId);
    return describePhotoImport(photo, variant as PexelsImageSize, importedAt);
  }

  const video = await pexels.getVideo(pexelsId);
  const file = video.video_files?.find((candidate) => String(candidate.id) === variant);
  if (!file) {
    throw new ImportError("That video file is no longer available on Pexels.", 404);
  }
  return describeVideoImport(video, file, importedAt);
}

/** Resolves to undefined instead of failing when the Uniform API answers 404 */
async function undefinedIfNotFound<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request;
  } catch (error) {
    if (statusOf(error) === 404) return undefined;
    throw error;
  }
}

async function getExistingAsset(
  assetClient: ImportDependencies["assetClient"],
  assetId: string
) {
  return (await undefinedIfNotFound(assetClient.get({ assetId })))?.asset;
}

/** Finds a file left behind by an earlier import that failed before saving the asset */
async function findLeftoverFile(
  fileClient: ImportDependencies["fileClient"],
  sourceId: string
): Promise<{ id: string; ready: boolean } | undefined> {
  const file = await undefinedIfNotFound(fileClient.get({ sourceId }));
  return file && { id: file.id, ready: file.state === FILE_READY_STATE };
}

async function uploadFile(
  deps: ImportDependencies,
  source: ImportSource,
  sourceId: string
): Promise<string> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  const download = await fetchFn(source.fileUrl);
  if (!download.ok || !download.body) {
    throw new ImportError(`Pexels returned status ${download.status} for the file.`, 502);
  }

  const contentLength = Number(download.headers.get("content-length"));
  let body: BodyInit = download.body;
  let size = contentLength;
  if (!contentLength) {
    // The upload needs the size up front
    const buffer = await download.arrayBuffer();
    body = new Uint8Array(buffer);
    size = buffer.byteLength;
  }
  if (size > FILE_MAX_SIZE) {
    await download.body.cancel().catch(() => undefined);
    throw new ImportError(
      `This file is ${Math.round(size / 1024 / 1024)} MB. The Uniform asset library accepts files up to ${FILE_MAX_SIZE / 1024 / 1024} MB; pick a smaller resolution.`,
      413,
      "file_too_large"
    );
  }

  const mediaType =
    download.headers.get("content-type")?.split(";")[0].trim() || source.mediaType;

  const { id, method, uploadUrl } = await deps.fileClient.insert({
    name: source.filename,
    size,
    mediaType,
    width: source.width,
    height: source.height,
    sourceId,
  });

  const upload = await fetchFn(uploadUrl, {
    method,
    body,
    headers: { "Content-Type": mediaType, "Content-Length": String(size) },
    // Needed to send a stream body from Node
    duplex: "half",
  } as RequestInit);
  if (!upload.ok) {
    throw new ImportError(`Uploading the file failed with status ${upload.status}.`, 502);
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const file = await deps.fileClient.get({ id });
    if (file.state === FILE_READY_STATE) return id;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new ImportError("Uniform took too long to process the file. Try again.", 504);
}

/**
 * Shapes an asset like a pick from the Uniform asset library.
 * `custom` is left out: it is only supported on assets from integrations.
 */
export function toAssetParamValueItem(asset: {
  _id: string;
  type: string;
  fields?: Record<string, unknown>;
}): AssetParamValueItem {
  const { custom: _custom, ...fields } = asset.fields ?? {};
  return {
    _id: asset._id,
    _source: UNIFORM_ASSETS_SOURCE,
    type: asset.type,
    fields: fields as AssetParamValueItem["fields"],
  };
}

/**
 * Copies a Pexels photo or video file into the Uniform asset library.
 * The clients must be authorized as the author (identity delegation), so the
 * author's own project permissions decide whether they may create assets.
 */
export async function importPexelsAsset(
  deps: ImportDependencies,
  params: ImportRequest
): Promise<ImportResponse> {
  const importedAt = deps.now?.() ?? new Date();
  const source = await resolveSource(deps.pexels, params, importedAt);
  assertAllowedHost(source.fileUrl);

  const assetId = deterministicUuid(`${params.projectId}:${source.sourceKey}`);
  const existing = await getExistingAsset(deps.assetClient, assetId);
  if (existing) {
    return { asset: toAssetParamValueItem(existing), reused: true };
  }

  const save = (fileId: string) =>
    deps.assetClient.save({
      asset: {
        _id: assetId,
        type: source.assetType,
        fields: {
          title: { type: "text", value: source.title },
          description: { type: "text", value: source.description },
          file: { type: "file", value: fileId },
        },
      },
    });

  const leftover = await findLeftoverFile(deps.fileClient, source.sourceKey);
  let saved = false;
  if (leftover?.ready) {
    try {
      await save(leftover.id);
      saved = true;
    } catch (error) {
      // The file may be attached to a trashed asset; upload a fresh copy instead
      if (statusOf(error) !== 409 && statusOf(error) !== 400) throw error;
    }
  }
  if (!saved) {
    // Source ids identify a file, so a retry after a half-finished import gets its own
    const sourceId = leftover
      ? `${source.sourceKey}:${importedAt.getTime()}`
      : source.sourceKey;
    await save(await uploadFile(deps, source, sourceId));
  }

  const created = await getExistingAsset(deps.assetClient, assetId);
  if (!created) {
    throw new ImportError("The asset was created but couldn't be read back.", 502);
  }
  return { asset: toAssetParamValueItem(created), reused: false };
}
