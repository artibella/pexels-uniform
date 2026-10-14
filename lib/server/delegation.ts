import type { NextApiRequest, NextApiResponse } from "next";
import {
  DELEGATION_COOKIE_NAME,
  DelegationTokenClient,
  needsRefresh,
  parseCookies,
  sealDelegationSession,
  serializeSessionCookie,
  unsealDelegationSession,
  verifyCsrf,
} from "@uniformdev/mesh-sdk/server";
// useDelegationFetch re-runs the session exchange and retries once when it sees this code
import { DELEGATION_EXPIRED_CODE } from "@uniformdev/mesh-sdk";
import { REQUIRED_DELEGATION_ENV } from "../importTypes";

const DEFAULT_API_HOST = "https://uniform.app";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

export function uniformApiHost(): string {
  return process.env.UNIFORM_API_HOST || DEFAULT_API_HOST;
}

const NOT_CONFIGURED_CODE = "not_configured";

/** Whether this deployment has the credentials identity delegation needs */
export function isDelegationConfigured(): boolean {
  return REQUIRED_DELEGATION_ENV.every((name) => Boolean(process.env[name]));
}

/**
 * Sends a 503 and returns false when the deployment isn't set up for delegation,
 * so a shared deployment without credentials explains itself instead of failing with a 500.
 */
export function checkConfigured(res: NextApiResponse): boolean {
  if (isDelegationConfigured()) return true;
  res.status(503).json({
    message: "This Pexels integration deployment isn't set up for adding assets to Uniform.",
    code: NOT_CONFIGURED_CODE,
  });
  return false;
}

function sessionSecret(): string {
  return requireEnv("MESH_SESSION_SECRET");
}

function tokenClient(): DelegationTokenClient {
  return new DelegationTokenClient({
    apiHost: uniformApiHost(),
    integrationId: requireEnv("UNIFORM_INTEGRATION_ID"),
    integrationSecret: requireEnv("UNIFORM_INTEGRATION_SECRET"),
  });
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Checks the Origin/Referer and the Mesh CSRF header on state-changing requests.
 * Sends a 403 and returns false when the check fails.
 */
export function checkCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  // The iframe calls its own origin, so without an explicit list the request's own host is allowed
  const allowedOrigins = process.env.MESH_ALLOWED_ORIGINS
    ? process.env.MESH_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [`https://${req.headers.host}`];
  const result = verifyCsrf(
    {
      origin: firstHeader(req.headers.origin),
      referer: firstHeader(req.headers.referer),
      secFetchSite: firstHeader(req.headers["sec-fetch-site"]),
      customHeader: firstHeader(req.headers["x-mesh-csrf"]),
    },
    {
      allowedOrigins,
      // Chromium often leaves out Origin on https://localhost iframe requests
      skipOriginValidation: process.env.NODE_ENV === "development",
    }
  );
  if (!result.ok) {
    console.warn(`CSRF check failed: ${result.reason}`);
    res.status(403).json({ message: "Request rejected." });
    return false;
  }
  return true;
}

function setSessionCookie(res: NextApiResponse, value: string, maxAge?: number) {
  res.setHeader(
    "Set-Cookie",
    serializeSessionCookie(DELEGATION_COOKIE_NAME, value, maxAge === undefined ? {} : { maxAge })
  );
}

async function storeSession(
  res: NextApiResponse,
  { accessToken, refreshToken, expiresIn }: { accessToken: string; refreshToken?: string; expiresIn: number }
) {
  const sealed = await sealDelegationSession(
    { accessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000 },
    sessionSecret()
  );
  setSessionCookie(res, sealed);
}

/** Exchanges the one-time session token from the dashboard and stores the result in the cookie */
export async function exchangeSessionToken(res: NextApiResponse, sessionToken: string) {
  await storeSession(res, await tokenClient().exchangeSessionToken(sessionToken));
}

export function clearSession(res: NextApiResponse) {
  setSessionCookie(res, "", 0);
}

export function sendDelegationExpired(res: NextApiResponse) {
  clearSession(res);
  res.status(401).json({
    message: "Your Uniform session expired. Try again.",
    code: DELEGATION_EXPIRED_CODE,
  });
}

/**
 * Returns the author's delegated access token, refreshing it when it is about to
 * expire. Returns undefined when there is no usable session; the caller then
 * responds with sendDelegationExpired.
 */
export async function getAccessToken(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | undefined> {
  const sealed = parseCookies(req.headers.cookie)[DELEGATION_COOKIE_NAME];
  if (!sealed) return undefined;

  const session = await unsealDelegationSession(sealed, sessionSecret());
  if (!session) return undefined;
  if (!needsRefresh(session)) return session.accessToken;

  // Without a refresh token the author consented for this session only, and the
  // dashboard has to hand out a new session token
  if (!session.refreshToken) return undefined;
  try {
    const refreshed = await tokenClient().refreshDelegationToken(session.refreshToken);
    await storeSession(res, refreshed);
    return refreshed.accessToken;
  } catch (error) {
    console.warn("Refreshing the delegation token failed", error);
    return undefined;
  }
}
