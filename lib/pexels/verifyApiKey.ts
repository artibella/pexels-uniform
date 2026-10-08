import { createPexelsClient, CreatePexelsClientOptions, PexelsApiError } from "./client";

export type ApiKeyCheck =
  | { status: "valid" }
  | { status: "invalid"; message: string }
  /** Pexels couldn't be asked (network, rate limit, outage); the key may still be fine */
  | { status: "unverified"; message: string };

/**
 * Checks an API key with the cheapest request Pexels offers: one curated photo.
 */
export async function verifyApiKey(
  apiKey: string,
  options?: CreatePexelsClientOptions
): Promise<ApiKeyCheck> {
  if (!apiKey.trim()) {
    return { status: "invalid", message: "Enter a Pexels API key." };
  }
  try {
    await createPexelsClient(apiKey.trim(), options).curatedPhotos({ perPage: 1 });
    return { status: "valid" };
  } catch (error) {
    if (error instanceof PexelsApiError && error.kind === "unauthorized") {
      return { status: "invalid", message: error.message };
    }
    return {
      status: "unverified",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
