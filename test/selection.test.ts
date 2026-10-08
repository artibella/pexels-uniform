import { describe, expect, it } from "vitest";
import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";
import {
  applyAssetPick,
  selectionKeyForPexelsAsset,
  selectionKeyForValueItem,
} from "../lib/selection";
import { photo, video } from "./fixtures";

const item = (type: string, sourceId?: string): AssetParamValueItem => ({
  _id: `${type}-${sourceId ?? "uniform"}`,
  type,
  fields: {
    url: { type: "text", value: "https://example.com/asset" },
    ...(sourceId ? { custom: { type: "object", value: { sourceId } } } : {}),
  },
});

describe("selection keys", () => {
  it("keys raw Pexels assets by type and id", () => {
    expect(selectionKeyForPexelsAsset(photo)).toBe("image-2014422");
    expect(selectionKeyForPexelsAsset(video)).toBe("video-1448735");
  });

  it("keys stored value items by type and source id", () => {
    expect(selectionKeyForValueItem(item("image", "2014422"))).toBe("image-2014422");
  });

  it("ignores value items that didn't come from Pexels", () => {
    expect(selectionKeyForValueItem(item("image"))).toBeUndefined();
  });
});

describe("applyAssetPick", () => {
  it("replaces the value for single-asset parameters", () => {
    expect(applyAssetPick([item("image", "1")], item("image", "2"), 1)).toEqual([
      item("image", "2"),
    ]);
  });

  it("starts from an empty value", () => {
    expect(applyAssetPick(undefined, item("image", "1"), 1)).toEqual([item("image", "1")]);
  });

  it("adds picks to multi-asset parameters and keeps other sources", () => {
    const current = [item("image")];

    expect(applyAssetPick(current, item("image", "1"), 3)).toEqual([
      item("image"),
      item("image", "1"),
    ]);
  });

  it("removes an already selected asset in multi-asset parameters", () => {
    const current = [item("image", "1"), item("video", "1")];

    expect(applyAssetPick(current, item("image", "1"), 3)).toEqual([item("video", "1")]);
  });

  it("ignores new picks once the limit is reached", () => {
    const current = [item("image", "1"), item("image", "2")];

    expect(applyAssetPick(current, item("image", "3"), 2)).toBe(current);
  });
});
