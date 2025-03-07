import { useMeshLocation } from "@uniformdev/mesh-sdk-react";
import { IntegrationSettings } from "../types";

export function useIntegrationSettings(): IntegrationSettings | undefined {
  const { metadata } = useMeshLocation();
  const settings = metadata.settings as IntegrationSettings | undefined;
  return settings;
}
