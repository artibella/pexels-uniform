import { useCallback, useContext, useMemo, useState } from "react";
import { LinkButton, toast } from "@uniformdev/design-system";
import {
  AssetParamValueItem,
  createDelegationFetch,
  DelegationContext,
  useMeshLocation,
} from "@uniformdev/mesh-sdk-react";
import {
  ImportErrorResponse,
  ImportKind,
  ImportResponse,
  PEXELS_API_KEY_HEADER,
} from "../importTypes";
import { useIntegrationSettings } from "./useIntegrationSettings";

export type AssetImporter = {
  /** Why importing isn't possible right now, or undefined when it is */
  unavailableReason?: string;
  isImporting: (kind: ImportKind, pexelsId: number) => boolean;
  importAsset: (
    kind: ImportKind,
    pexelsId: number,
    variant: string,
    label: string
  ) => Promise<void>;
};

const pendingKey = (kind: ImportKind, pexelsId: number) => `${kind}-${pexelsId}`;

/**
 * Imports Pexels photo sizes and video files into the Uniform asset library
 * through /api/import, as the signed-in author. Returns undefined when importing is
 * turned off, i.e. when there is no ImportDelegationProvider session to use.
 */
export function useAssetImport({
  onImported,
}: {
  onImported?: (asset: AssetParamValueItem) => void;
} = {}): AssetImporter | undefined {
  // Read the context directly: useDelegation throws when the provider isn't mounted
  const delegation = useContext(DelegationContext);
  const reacquire = delegation?.reacquire;
  const delegationFetch = useMemo(
    () => (reacquire ? createDelegationFetch({ reacquire }) : fetch),
    [reacquire]
  );
  const status = delegation?.status;
  const { metadata, router } = useMeshLocation();
  const apiKey = useIntegrationSettings()?.apiKey?.trim();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  let unavailableReason: string | undefined;
  if (status === "disabled") {
    unavailableReason = "Identity delegation isn't enabled for the Pexels integration.";
  } else if (status === "error") {
    unavailableReason =
      delegation?.error?.message || "Couldn't connect to your Uniform account. Reload to try again.";
  } else if (status !== "active") {
    unavailableReason = "Connecting to your Uniform account…";
  } else if (!apiKey) {
    unavailableReason = "Add a Pexels API key in the integration settings.";
  }

  const importAsset = useCallback(
    async (kind: ImportKind, pexelsId: number, variant: string, label: string) => {
      if (!apiKey) return;
      const key = pendingKey(kind, pexelsId);
      setPending((current) => new Set(current).add(key));
      const toastId = toast.loading(`Adding ${label} to the asset library…`);
      try {
        const response = await delegationFetch("/api/import", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            [PEXELS_API_KEY_HEADER]: apiKey,
          },
          body: JSON.stringify({ projectId: metadata.projectId, kind, pexelsId, variant }),
        });
        const body = (await response.json().catch(() => undefined)) as
          | ImportResponse
          | ImportErrorResponse
          | undefined;
        toast.dismiss(toastId);

        if (!response.ok || !body || !("asset" in body)) {
          const message =
            (body && "message" in body && body.message) ||
            `Adding the asset failed with status ${response.status}.`;
          toast.error(message);
          return;
        }

        const assetId = body.asset._id;
        toast.success(
          <span>
            {body.reused
              ? `${label} is already in the asset library.`
              : `Added ${label} to the asset library.`}{" "}
            <LinkButton
              type="button"
              // The dashboard doesn't navigate in place from here, so open a new tab
              onClick={() =>
                router.navigatePlatform(
                  `/dashboards/canvas/assets?assetId=${encodeURIComponent(assetId)}`,
                  { target: "_blank" }
                )
              }
            >
              Open asset
            </LinkButton>
          </span>
        );
        onImported?.(body.asset);
      } catch {
        toast.dismiss(toastId);
        toast.error("Couldn't reach the Pexels integration. Check your connection and try again.");
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [apiKey, delegationFetch, metadata.projectId, onImported, router]
  );

  const isImporting = useCallback(
    (kind: ImportKind, pexelsId: number) => pending.has(pendingKey(kind, pexelsId)),
    [pending]
  );

  if (!delegation) return undefined;
  return { unavailableReason, isImporting, importAsset };
}
