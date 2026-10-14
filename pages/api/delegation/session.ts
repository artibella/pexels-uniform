import type { NextApiRequest, NextApiResponse } from "next";
import { DelegationTokenError } from "@uniformdev/mesh-sdk/server";
import { checkConfigured, checkCsrf, exchangeSessionToken } from "../../../lib/server/delegation";

/**
 * Exchanges the one-time session token from the Uniform dashboard for a
 * delegated access token, stored in an HttpOnly cookie.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }
  if (!checkCsrf(req, res)) return;
  if (!checkConfigured(res)) return;

  const sessionToken = req.body?.sessionToken;
  if (typeof sessionToken !== "string" || !sessionToken) {
    return res.status(400).json({ message: "sessionToken is required." });
  }

  try {
    await exchangeSessionToken(res, sessionToken);
    return res.status(204).end();
  } catch (error) {
    if (error instanceof DelegationTokenError) {
      // The message is sanitised by the SDK
      return res.status(error.status >= 500 ? 502 : 401).json({ message: error.message });
    }
    console.error("Delegation token exchange failed", error);
    return res.status(500).json({ message: "Couldn't start a Uniform session." });
  }
}
