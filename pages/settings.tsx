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
  InputSelect,
  isValidUrl,
  VerticalRhythm,
} from "@uniformdev/design-system";

import type { NextPage } from "next";
import { useState } from "react";
import { IntegrationSettings } from "../lib";

type Message = {
  type: "success" | "error";
  title?: string;
  text: string;
};

const Settings: NextPage = () => {
  const { value, setValue } = useMeshLocation<
    "settings",
    IntegrationSettings
  >();

  const [settings, setSettings] = useState<IntegrationSettings>({
    apiKey: value.apiKey ?? "",
    assetsPerPage: value.assetsPerPage ?? 15,
    addAuthorCredits: value.addAuthorCredits ?? true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidSettings, setIsValidSettings] = useState(false);
  const [message, setMessage] = useState<Message | undefined>(undefined);

  const handleSaveClick = async () => {
    setIsProcessing(true);
    try {
      await setValue(() => ({
        newValue: settings,
      }));

      setMessage({
        type: "success",
        text: "Settings saved successfully.",
      });
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

  const updateSettings = (updates: Partial<IntegrationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updates,
    }));

    setMessage(undefined);

    if (updates.apiKey !== undefined) {
      setIsValidSettings(false);
    }
  };

  return (
    <VerticalRhythm gap="lg">
      <LoadingOverlay isActive={isProcessing} />
      <VerticalRhythm gap="lg">
        <Fieldset legend={<Heading level={3}>Pexels API Settings</Heading>}>
          <Input
            id="apiKey"
            name="apiKey"
            label="Pexels API Key"
            placeholder="<insert API key>"
            onChange={(e) => updateSettings({ apiKey: e.target.value ?? "" })}
            value={settings?.apiKey ?? ""}
          />
        </Fieldset>
        <Fieldset legend={<Heading level={3}>Asset Library Settings</Heading>}>
          <Input
            id="assetsPerPage"
            name="assetsPerPage"
            label="Assets Per Page"
            type="number"
            placeholder="15"
            onChange={(e) =>
              updateSettings({ assetsPerPage: Number(e.target.value) || 15 })
            }
            value={settings?.assetsPerPage?.toString() ?? "15"}
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="addAuthorCredits"
              name="addAuthorCredits"
              checked={settings?.addAuthorCredits ?? true}
              onChange={(e) =>
                updateSettings({ addAuthorCredits: e.target.checked })
              }
            />
            <label htmlFor="addAuthorCredits">Add author credits</label>
          </div>
        </Fieldset>
      </VerticalRhythm>
      <HorizontalRhythm gap="base">
        <Button type="button" buttonType="secondary" onClick={handleSaveClick}>
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

export default Settings;
