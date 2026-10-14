import React from "react";
import Image from "next/image";
import { MenuItem } from "@uniformdev/design-system";

export const ViewOnPexelsMenuItem: React.FC<{ url: string }> = ({ url }) => (
  <MenuItem onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
    {/* Decorative: the menu item text already names the action */}
    <Image src="/pexels-app-icon.svg" alt="" width={12} height={12} />
    View on Pexels
  </MenuItem>
);
