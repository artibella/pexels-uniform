import React from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
} from "@uniformdev/design-system";
import clsx from "clsx";

export const AssetGridItemSkeleton: React.FC = () => {
  return (
    <ObjectGridItem
      header={
        <ObjectGridItemHeading
          data-testid="skeleton-title"
          heading={
            <div className="bg-gray-200 rounded w-4/5 h-5 animate-pulse"></div>
          }
        />
      }
      cover={
        <div className="bg-gray-200 rounded w-full h-[200px] animate-pulse"></div>
      }
    />
  );
};

// Add a keyframes animation to the global style
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    @keyframes pulse {
      0% {
        opacity: 0.6;
      }
      50% {
        opacity: 0.8;
      }
      100% {
        opacity: 0.6;
      }
    }
  `;
  document.head.appendChild(styleElement);
}
