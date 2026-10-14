import React from "react";
import { DelegationProvider, useUniformMeshSdk } from "@uniformdev/mesh-sdk-react";
import { checkDelegationStatus } from "../lib/delegationStatus";
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";

const CSRF_HEADERS = { "x-mesh-csrf": "1" };

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return body?.message || fallback;
}

async function exchangeSessionToken(sessionToken: string): Promise<void> {
  const response = await fetch("/api/delegation/session", {
    method: "POST",
    headers: { "content-type": "application/json", ...CSRF_HEADERS },
    body: JSON.stringify({ sessionToken }),
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, "Couldn't start a Uniform session."));
  }
}

/**
 * Lets the import actions call Uniform as the signed-in author.
 * Unlike DelegationGate it renders its children in every state, so browsing and
 * downloading work even when identity delegation is unavailable. When importing is
 * turned off in the integration settings, no session is started at all.
 */
export function ImportDelegationProvider({ children }: { children: React.ReactNode }) {
  const sdk = useUniformMeshSdk();
  const enabled = useIntegrationSettings()?.enableAssetImport === true;
  if (!enabled) return <>{children}</>;

  return (
    <DelegationProvider
      sdk={sdk}
      checkActive={checkDelegationStatus}
      onSessionToken={exchangeSessionToken}
    >
      {children}
    </DelegationProvider>
  );
}
