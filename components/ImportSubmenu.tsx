import React from "react";
import { AssetImporter } from "../lib/hooks/useAssetImport";
import { ImportKind } from "../lib/importTypes";
import { OptionsSubmenu, SubmenuOption } from "./OptionsSubmenu";

interface ImportSubmenuProps {
  importer: AssetImporter;
  kind: ImportKind;
  pexelsId: number;
  options: SubmenuOption[];
}

/** Submenu that copies one resolution of a Pexels item into the Uniform asset library */
export const ImportSubmenu: React.FC<ImportSubmenuProps> = ({
  importer,
  kind,
  pexelsId,
  options,
}) => {
  const importing = importer.isImporting(kind, pexelsId);
  return (
    <OptionsSubmenu
      label="Add to Uniform Asset Library"
      icon="add-r"
      options={options}
      disabledReason={
        importer.unavailableReason ?? (importing ? "Adding to the asset library…" : undefined)
      }
      onSelect={({ variant, label }) => importer.importAsset(kind, pexelsId, variant, label)}
    />
  );
};
