import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { DELEGATION_COOKIE_NAME, sealDelegationSession } from "@uniformdev/mesh-sdk/server";
import { checkConfigured, checkCsrf, getAccessToken } from "../lib/server/delegation";

const SECRET = "test-session-secret-that-is-long-enough-1234";

function request(headers: Record<string, string> = {}): NextApiRequest {
  return { headers: { host: "pexels.example", ...headers } } as unknown as NextApiRequest;
}

function response() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    body: undefined as unknown,
    setHeader(name: string, value: unknown) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

beforeEach(() => {
  vi.stubEnv("MESH_SESSION_SECRET", SECRET);
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAccessToken", () => {
  it("returns nothing without a session cookie", async () => {
    const res = response();
    expect(await getAccessToken(request(), res as unknown as NextApiResponse)).toBeUndefined();
  });

  it("returns nothing for a tampered cookie", async () => {
    const res = response();
    const req = request({ cookie: `${DELEGATION_COOKIE_NAME}=not-a-jwe` });
    expect(await getAccessToken(req, res as unknown as NextApiResponse)).toBeUndefined();
  });

  it("returns the access token from a valid session", async () => {
    const sealed = await sealDelegationSession(
      { accessToken: "access-123", refreshToken: undefined, expiresAt: Date.now() + 10 * 60_000 },
      SECRET
    );
    const req = request({ cookie: `${DELEGATION_COOKIE_NAME}=${sealed}` });
    const res = response();
    expect(await getAccessToken(req, res as unknown as NextApiResponse)).toBe("access-123");
  });

  it("returns nothing for an expiring session without a refresh token", async () => {
    const sealed = await sealDelegationSession(
      { accessToken: "access-123", refreshToken: undefined, expiresAt: Date.now() + 1000 },
      SECRET
    );
    const req = request({ cookie: `${DELEGATION_COOKIE_NAME}=${sealed}` });
    const res = response();
    expect(await getAccessToken(req, res as unknown as NextApiResponse)).toBeUndefined();
  });
});

describe("checkCsrf", () => {
  it("accepts requests from the integration's own origin with the CSRF header", () => {
    const res = response();
    const req = request({ origin: "https://pexels.example", "x-mesh-csrf": "1" });
    expect(checkCsrf(req, res as unknown as NextApiResponse)).toBe(true);
  });

  it("rejects other origins", () => {
    const res = response();
    const req = request({ origin: "https://attacker.example", "x-mesh-csrf": "1" });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(checkCsrf(req, res as unknown as NextApiResponse)).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("rejects requests without the CSRF header", () => {
    const res = response();
    const req = request({ origin: "https://pexels.example" });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(checkCsrf(req, res as unknown as NextApiResponse)).toBe(false);
  });
});

describe("checkCsrf with MESH_ALLOWED_ORIGINS", () => {
  it("uses the configured origins instead of the request host", () => {
    vi.stubEnv("MESH_ALLOWED_ORIGINS", "https://pexels-uniform.vercel.app, https://localhost:9000");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const allowed = request({ origin: "https://localhost:9000", "x-mesh-csrf": "1" });
    expect(checkCsrf(allowed, response() as unknown as NextApiResponse)).toBe(true);

    const hostOnly = request({ origin: "https://pexels.example", "x-mesh-csrf": "1" });
    expect(checkCsrf(hostOnly, response() as unknown as NextApiResponse)).toBe(false);
  });
});

describe("checkConfigured", () => {
  it("rejects with not_configured when delegation credentials are missing", () => {
    vi.stubEnv("UNIFORM_INTEGRATION_ID", "");
    vi.stubEnv("UNIFORM_INTEGRATION_SECRET", "secret");
    const res = response();

    expect(checkConfigured(res as unknown as NextApiResponse)).toBe(false);
    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ code: "not_configured" });
  });

  it("passes when all credentials are set", () => {
    vi.stubEnv("UNIFORM_INTEGRATION_ID", "5b3e5f2a-1c4d-4e8f-9a0b-1c2d3e4f5a6b");
    vi.stubEnv("UNIFORM_INTEGRATION_SECRET", "secret");
    const res = response();

    expect(checkConfigured(res as unknown as NextApiResponse)).toBe(true);
    expect(res.statusCode).toBe(200);
  });
});
