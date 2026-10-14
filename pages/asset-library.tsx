import React from "react";
import { AssetLibrary } from "../components/AssetLibrary";
import { ImportDelegationProvider } from "../components/ImportDelegationProvider";

// The asset library location browses, downloads and imports into the Uniform
// asset library. Mesh gives it no value to write, so picking happens in the
// asset parameter location
const AssetLibraryPage = () => (
  <ImportDelegationProvider>
    <AssetLibrary mode="library" />
  </ImportDelegationProvider>
);

export default AssetLibraryPage;
