import { useMeshLocation } from "@uniformdev/mesh-sdk-react";
import React from "react";

import { AssetLibrary } from "../components/AssetLibrary";

const AssetLibraryPage = () => {
  const { metadata } = useMeshLocation("assetLibrary");

  return (
    <div>
      <AssetLibrary initialSearchQuery="" mode="library" />
    </div>
  );
};

export default AssetLibraryPage;
