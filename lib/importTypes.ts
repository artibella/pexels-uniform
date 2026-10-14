import { AssetParamValueItem } from "@uniformdev/mesh-sdk-react";

/** Pexels media kinds that can be imported into the Uniform asset library */
export type ImportKind = "photo" | "video";

/**
 * Body of POST /api/import.
 * `variant` is a photo size key (see PexelsImageSize) or a video file id.
 */
export type ImportRequest = {
  projectId: string;
  kind: ImportKind;
  pexelsId: number;
  variant: string;
};

export type ImportResponse = {
  /** The Uniform asset, shaped like a pick from the Uniform asset library */
  asset: AssetParamValueItem;
  /** True when this item and resolution was imported before */
  reused: boolean;
};

export type ImportErrorResponse = {
  message: string;
  code?: string;
};

/** Header carrying the Pexels API key from the integration settings */
export const PEXELS_API_KEY_HEADER = "x-pexels-api-key";

/** Server env vars identity delegation needs; without them the import action stays disabled */
export const REQUIRED_DELEGATION_ENV = [
  "UNIFORM_INTEGRATION_ID",
  "UNIFORM_INTEGRATION_SECRET",
  "MESH_SESSION_SECRET",
] as const;
