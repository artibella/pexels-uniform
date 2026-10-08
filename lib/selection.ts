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
  const sourceId = item.fields?.custom?.value?.sourceId;
  if (typeof sourceId !== "string" && typeof sourceId !== "number") {
    return undefined;
  }
  return `${item.type}-${sourceId}`;
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
  const isAlreadySelected = value.some(
    (item) => selectionKeyForValueItem(item) === pickedKey
  );
  if (isAlreadySelected) {
    return value.filter((item) => selectionKeyForValueItem(item) !== pickedKey);
  }
  if (value.length >= maxAssets) {
    return value;
  }
  return [...value, picked];
}
