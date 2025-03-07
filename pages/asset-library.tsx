import { useMeshLocation } from "@uniformdev/mesh-sdk-react";
import React from "react";

import { AssetLibrary } from "../components/AssetLibrary";
import { useIntegrationSettings } from "../lib/hooks/useIntegrationSettings";

const AssetLibraryPage = () => {
  const { metadata } = useMeshLocation("assetLibrary");

  const integrationSettings = useIntegrationSettings();

  // Initialize with default values
  const assetMetadata = {
    limit: integrationSettings?.assetsPerPage ?? 15,
    ...metadata,
  };

  return (
    <div>
      <AssetLibrary initialSearchQuery="" mode="library" />
    </div>
  );
};
export default AssetLibraryPage;
