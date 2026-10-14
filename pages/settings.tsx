import {
  Button,
  Input,
  LoadingOverlay,
  Callout,
  useMeshLocation,
} from "@uniformdev/mesh-sdk-react";
import {
  Fieldset,
  Heading,
  HorizontalRhythm,
  Icon,
  IconButton,
  InputToggle,
  VerticalRhythm,
} from "@uniformdev/design-system";

import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { IntegrationSettings } from "../lib/types";
import { DelegationNotConfiguredError, checkDelegationStatus } from "../lib/delegationStatus";
import { REQUIRED_DELEGATION_ENV } from "../lib/importTypes";
import { DEFAULT_ASSETS_PER_PAGE } from "../lib/constants";
import { MAX_PER_PAGE } from "../lib/pexels/client";
import { clampPerPage } from "../lib/pexels/fetchMediaPage";
import { verifyApiKey } from "../lib/pexels/verifyApiKey";

type Message = {
  type: "success" | "error" | "caution";
  title?: string;
  text: string;
};

const Settings: NextPage = () => {
  const { value, setValue } = useMeshLocation<"settings", IntegrationSettings>();

  const [apiKey, setApiKey] = useState(value?.apiKey ?? "");
  // Kept as text so the field can be cleared while typing; parsed on save
  const [assetsPerPage, setAssetsPerPage] = useState(
    String(value?.assetsPerPage ?? DEFAULT_ASSETS_PER_PAGE)
  );
  const [addAuthorCredits, setAddAuthorCredits] = useState(
    value?.addAuthorCredits ?? true
  );

  const [enableAssetImport, setEnableAssetImport] = useState(
    value?.enableAssetImport ?? false
  );
  const deploymentWarning = useDeploymentImportWarning(enableAssetImport);

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<Message>();

  const handleSave = async () => {
    setIsProcessing(true);
    setMessage(undefined);
    setApiKeyError(undefined);
    try {
      const keyCheck = await verifyApiKey(apiKey);
      if (keyCheck.status === "invalid") {
        setApiKeyError(keyCheck.message);
        return;
      }

      const parsedPerPage = clampPerPage(
        Number(assetsPerPage) || DEFAULT_ASSETS_PER_PAGE
      );
      setAssetsPerPage(String(parsedPerPage));

      await setValue(() => ({
        newValue: {
          apiKey: apiKey.trim(),
          assetsPerPage: parsedPerPage,
          addAuthorCredits,
          enableAssetImport,
        },
      }));

      setMessage(
        keyCheck.status === "unverified"
          ? {
              type: "caution",
              title: "Settings saved, but the API key couldn't be checked.",
              text: keyCheck.message,
            }
          : { type: "success", text: "Settings saved successfully." }
      );
    } catch (error) {
      setMessage({
        type: "error",
        title: "Unable to save settings.",
        text: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VerticalRhythm gap="lg">
      <LoadingOverlay isActive={isProcessing} />
      <Fieldset legend={<Heading level={3}>Pexels API Settings</Heading>}>
        <Input
          id="apiKey"
          name="apiKey"
          type={showApiKey ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          icon={
            <IconButton
              type="button"
              buttonType="ghost"
              size="sm"
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
              aria-pressed={showApiKey}
              title={showApiKey ? "Hide API key" : "Show API key"}
              onClick={() => setShowApiKey((show) => !show)}
            >
              <Icon icon={showApiKey ? "eye-alt" : "eye"} size={16} />
            </IconButton>
          }
          label="Pexels API Key"
          caption={
            <>
              Get a free key from the{" "}
              <a
                className="underline"
                href="https://www.pexels.com/api/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pexels API page
              </a>
              . The key is sent from the editor&apos;s browser, so anyone who can
              use this integration can see it.
            </>
          }
          errorMessage={apiKeyError}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyError(undefined);
            setMessage(undefined);
          }}
        />
      </Fieldset>
      <Fieldset legend={<Heading level={3}>Asset Library Settings</Heading>}>
        <VerticalRhythm gap="base">
          <Input
            id="assetsPerPage"
            name="assetsPerPage"
            label="Assets Per Page"
            type="number"
            min={1}
            max={MAX_PER_PAGE}
            caption={`Between 1 and ${MAX_PER_PAGE}, the most Pexels returns per request.`}
            value={assetsPerPage}
            onChange={(e) => {
              setAssetsPerPage(e.target.value);
              setMessage(undefined);
            }}
          />
          <InputToggle
            type="checkbox"
            name="addAuthorCredits"
            label="Add author credits to asset descriptions"
            checked={addAuthorCredits}
            onChange={(e) => {
              setAddAuthorCredits(e.currentTarget.checked);
              setMessage(undefined);
            }}
            caption="The Pexels API guidelines ask you to credit photographers whenever possible, for example “Photo by John Doe on Pexels” with a link to Pexels. If you turn this off, the credit is still stored with each asset in custom.attribution, along with the author and Pexels page, so your frontend can display it."
          />
        </VerticalRhythm>
      </Fieldset>
      <Fieldset legend={<Heading level={3}>Uniform Asset Library</Heading>}>
        <VerticalRhythm gap="base">
          <InputToggle
            type="checkbox"
            name="enableAssetImport"
            label="Allow adding Pexels assets to the Uniform asset library"
            checked={enableAssetImport}
            onChange={(e) => {
              setEnableAssetImport(e.currentTarget.checked);
              setMessage(undefined);
            }}
            caption="Adds an “Add to Uniform Asset Library” action that copies the chosen resolution into this project's asset library, with the Pexels attribution. Imports run as the signed-in author through identity delegation, so the integration deployment needs its delegation credentials and authors need permission to create assets."
          />
          {deploymentWarning && (
            <Callout type="caution" title="This deployment can't add assets yet.">
              {deploymentWarning}
            </Callout>
          )}
        </VerticalRhythm>
      </Fieldset>
      <HorizontalRhythm gap="base">
        <Button type="button" buttonType="secondary" onClick={handleSave}>
          Save
        </Button>
      </HorizontalRhythm>
      {message && (
        <Callout title={message.title} type={message.type}>
          {message.text}
        </Callout>
      )}
    </VerticalRhythm>
  );
};

/**
 * Asks the integration's server whether it has the identity delegation credentials,
 * so admins learn about a deployment without them before authors do.
 */
function useDeploymentImportWarning(enabled: boolean): string | undefined {
  const [warning, setWarning] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    checkDelegationStatus().catch((error) => {
      if (cancelled || !(error instanceof DelegationNotConfiguredError)) return;
      setWarning(
        `${error.message} The action stays disabled until ${REQUIRED_DELEGATION_ENV.join(", ")} are set on the server.`
      );
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return enabled ? warning : undefined;
}

export default Settings;
