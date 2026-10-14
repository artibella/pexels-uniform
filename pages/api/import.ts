import type { NextApiRequest, NextApiResponse } from "next";
import { checkConfigured, checkCsrf, getAccessToken, sendDelegationExpired } from "../../lib/server/delegation";
import { importPexelsAsset, ImportError, statusOf } from "../../lib/server/importAsset";
import { createUniformClients } from "../../lib/server/uniformClients";
import { createPexelsClient, PexelsApiError } from "../../lib/pexels/client";
import {
  ImportErrorResponse,
  ImportRequest,
  ImportResponse,
  PEXELS_API_KEY_HEADER,
} from "../../lib/importTypes";

export const config = {
  // Downloading, uploading and processing a large video takes a while
  maxDuration: 300,
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseParams(body: unknown): ImportRequest | undefined {
  const { projectId, kind, pexelsId, variant } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof projectId !== "string" ||
    !UUID_PATTERN.test(projectId) ||
    (kind !== "photo" && kind !== "video") ||
    typeof pexelsId !== "number" ||
    !Number.isSafeInteger(pexelsId) ||
    pexelsId <= 0 ||
    typeof variant !== "string" ||
    !/^[a-z0-9]{1,20}$/i.test(variant)
  ) {
    return undefined;
  }
  return { projectId, kind, pexelsId, variant };
}

const PEXELS_ERROR_STATUS: Partial<Record<PexelsApiError["kind"], number>> = {
  "not-found": 404,
  "rate-limited": 429,
};

function sendError(res: NextApiResponse<ImportErrorResponse>, error: unknown) {
  if (error instanceof ImportError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  if (error instanceof PexelsApiError) {
    const status = PEXELS_ERROR_STATUS[error.kind] ?? 502;
    return res.status(status).json({ message: error.message });
  }

  const uniformStatus = statusOf(error);
  if (uniformStatus === 401) {
    // The delegated token was rejected; useDelegationFetch starts a new session and retries
    return sendDelegationExpired(res);
  }
  if (uniformStatus === 403 || uniformStatus === 404) {
    return res.status(403).json({
      message: "You don't have permission to add assets to this project.",
      code: "forbidden",
    });
  }
  if (uniformStatus === 429) {
    return res.status(429).json({ message: "Uniform is rate limiting requests. Try again shortly." });
  }

  console.error("Pexels import failed", error);
  return res.status(500).json({ message: "Adding the asset failed. Try again." });
}

/**
 * Imports a Pexels photo size or video file into the Uniform asset library
 * as the signed-in author.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImportResponse | ImportErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }
  if (!checkCsrf(req, res)) return;
  if (!checkConfigured(res)) return;

  const params = parseParams(req.body);
  if (!params) {
    return res.status(400).json({ message: "Invalid import request." });
  }

  const pexelsApiKey = req.headers[PEXELS_API_KEY_HEADER];
  if (typeof pexelsApiKey !== "string" || !pexelsApiKey.trim()) {
    return res.status(400).json({ message: "The Pexels API key is missing." });
  }

  const accessToken = await getAccessToken(req, res);
  if (!accessToken) {
    return sendDelegationExpired(res);
  }

  try {
    const result = await importPexelsAsset(
      {
        ...createUniformClients(accessToken, params.projectId),
        pexels: createPexelsClient(pexelsApiKey.trim()),
      },
      params
    );
    return res.status(result.reused ? 200 : 201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
}
