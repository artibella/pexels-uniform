import React from "react";
import {
  ObjectGridItem,
  ObjectGridItemHeading,
} from "@uniformdev/design-system";

export const GridItemSkeleton: React.FC = () => (
  <ObjectGridItem
    header={
      <ObjectGridItemHeading
        data-testid="skeleton-title"
        heading={<div className="bg-gray-200 rounded w-4/5 h-5 animate-pulse" />}
      />
    }
    cover={<div className="bg-gray-200 rounded w-full h-[200px] animate-pulse" />}
  />
);
