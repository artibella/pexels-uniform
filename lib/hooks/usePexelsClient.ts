import { useMemo } from "react";
import { createPexelsClient, PexelsClient } from "../pexels/client";
import { useIntegrationSettings } from "./useIntegrationSettings";

/**
 * Returns a Pexels client for the API key in the integration settings,
 * or null when no key is configured. A new client is created when the key changes.
 */
export function usePexelsClient(): PexelsClient | null {
  const apiKey = useIntegrationSettings()?.apiKey?.trim();
  return useMemo(() => (apiKey ? createPexelsClient(apiKey) : null), [apiKey]);
}
