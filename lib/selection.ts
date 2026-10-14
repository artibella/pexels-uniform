import { AssetParamValue, AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import { PexelsAPIImage, PexelsAPIVideo } from "./types";

/**
 * Pexels photo and video ids are separate sequences, so the key includes the type.
 */
export function selectionKeyForPexelsAsset(
  asset: PexelsAPIImage | PexelsAPIVideo
): string {
  const type = "video_files" in asset ? "video" : "image";
  return `${type}-${asset.id}`;
}

/**
 * Derives the selection key from a stored asset parameter value item.
 * Returns undefined for items that weren't picked from Pexels.
 */
export function selectionKeyForValueItem(
  item: AssetParamValueItem
): string | undefined {
  // Other sources can use the same ids, so only assets that link to their Pexels
  // page get a key. The file URL isn't reliable: older Pexels videos were served
  // from Vimeo. Earlier versions stored the video page as videoOriginalUrl.
  const custom = item.fields?.custom?.value;
  const pexelsPage = custom?.pexelsUrl ?? custom?.videoOriginalUrl;
  if (typeof pexelsPage !== "string" || !isPexelsUrl(pexelsPage)) {
    return undefined;
  }
  const sourceId = custom?.sourceId;
  if (typeof sourceId !== "string" && typeof sourceId !== "number") {
    return undefined;
  }
  return `${item.type}-${sourceId}`;
}

function isPexelsUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "pexels.com" || hostname.endsWith(".pexels.com");
  } catch {
    return false;
  }
}

/**
 * Applies a pick to the current parameter value.
 * Single-asset parameters are replaced. Multi-asset parameters toggle the picked
 * asset and ignore new picks once maxAssets is reached.
 */
export function applyAssetPick(
  currentValue: AssetParamValue | undefined,
  picked: AssetParamValueItem,
  maxAssets: number
): AssetParamValue {
  const value = currentValue ?? [];
  if (maxAssets <= 1) {
    return [picked];
  }

  const pickedKey = selectionKeyForValueItem(picked);
  const isAlreadySelected =
    pickedKey !== undefined &&
    value.some((item) => selectionKeyForValueItem(item) === pickedKey);
  if (isAlreadySelected) {
    return value.filter((item) => selectionKeyForValueItem(item) !== pickedKey);
  }
  if (value.length >= maxAssets) {
    return value;
  }
  return [...value, picked];
}

/**
 * Adds an imported Uniform asset to the current parameter value.
 * Unlike a pick it never toggles: an asset that is already there stays, and
 * multi-asset parameters that are full are left unchanged.
 */
export function applyAssetImport(
  currentValue: AssetParamValue | undefined,
  imported: AssetParamValueItem,
  maxAssets: number
): AssetParamValue {
  const value = currentValue ?? [];
  if (maxAssets <= 1) {
    return [imported];
  }
  const isPresent = value.some(
    (item) => item._id === imported._id && item._source === imported._source
  );
  if (isPresent || value.length >= maxAssets) {
    return value;
  }
  return [...value, imported];
}
