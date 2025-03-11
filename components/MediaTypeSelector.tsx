import React from "react";
import { InputSelect } from "@uniformdev/design-system";
import { MediaType } from "../lib/types";

interface MediaTypeSelectorProps {
  value: MediaType;
  onChange: (value: MediaType) => void;
  allowedTypes?: string[];
}

// Define the option interface for InputSelect
interface MediaTypeOption {
  label: string;
  value: MediaType;
}

const MediaTypeSelector: React.FC<MediaTypeSelectorProps> = ({
  value,
  onChange,
  allowedTypes = ["image", "video"],
}) => {
  // Create the available options based on allowed types
  const options: MediaTypeOption[] = [];

  if (allowedTypes.includes("image")) {
    options.push({
      label: "Photos",
      value: MediaType.Photo,
    });
  }

  if (allowedTypes.includes("video")) {
    options.push({
      label: "Videos",
      value: MediaType.Video,
    });
  }

  // Only render the selector if we have multiple options
  if (options.length <= 1) {
    return null;
  }

  // Event handler for onChange
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Ensure we're passing a valid MediaType enum value
    const mediaType =
      e.currentTarget.value === MediaType.Video
        ? MediaType.Video
        : MediaType.Photo;

    onChange(mediaType);
  };

  return (
    <InputSelect
      label="Media Type"
      showLabel={false}
      name="mediaType"
      options={options}
      value={value}
      onChange={handleChange}
    />
  );
};

export default MediaTypeSelector;
