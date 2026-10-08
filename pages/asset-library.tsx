import React from "react";
import { AssetLibrary } from "../components/AssetLibrary";

// The asset library location only browses: Mesh gives it no value to write,
// so picking happens in the asset parameter location
const AssetLibraryPage = () => <AssetLibrary mode="library" />;

export default AssetLibraryPage;
