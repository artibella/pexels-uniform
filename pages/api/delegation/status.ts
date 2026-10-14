import type { NextApiRequest, NextApiResponse } from "next";
import { checkConfigured, getAccessToken } from "../../../lib/server/delegation";

/**
 * Reports whether the HttpOnly delegation cookie holds a usable session,
 * since the browser can't read it.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }
  res.setHeader("Cache-Control", "no-store");
  if (!checkConfigured(res)) return;
  const accessToken = await getAccessToken(req, res);
  return res.status(accessToken ? 204 : 401).end();
}
