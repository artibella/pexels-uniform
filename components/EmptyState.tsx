import React from "react";
import { DashedBox, Icon, Heading } from "@uniformdev/design-system";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "photo" | "video";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
}) => (
  <DashedBox bgColor="transparent" boxHeight="lg" textAlign="center">
    <div className="text-gray-400 mb-2 text-5xl">
      {icon && <Icon icon="search-loading" />}
    </div>
    <Heading level={3}>{title}</Heading>
    <p>{description}</p>
  </DashedBox>
);
