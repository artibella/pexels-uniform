import React from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
} from "@uniformdev/design-system";

export const VideoGridItemSkeleton: React.FC = () => {
  return (
    <ObjectGridItem
      header={
        <ObjectGridItemHeading
          data-testid="video-skeleton-title"
          heading={
            <div className="bg-gray-200 rounded w-4/5 h-5 animate-pulse"></div>
          }
        />
      }
      cover={
        <div className="relative">
          {/* Video thumbnail skeleton */}
          <div className="bg-gray-200 rounded w-full h-[200px] animate-pulse"></div>
        </div>
      }
    />
  );
};

// Add a keyframes animation to the global style if it doesn't exist already
if (typeof document !== "undefined") {
  if (!document.querySelector("style[data-skeleton-animation]")) {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-skeleton-animation", "");
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
}
