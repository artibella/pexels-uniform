import React from "react";
import { InputSelect } from "@uniformdev/design-system";
import { MediaFilters } from "../lib/pexels/fetchMediaPage";

type FilterOption = { label: string; value: string };

type FilterDefinition = {
  label: string;
  options: FilterOption[];
};

// Values accepted by the Pexels search endpoints
export const FILTER_DEFINITIONS: Record<keyof MediaFilters, FilterDefinition> = {
  orientation: {
    label: "Orientation",
    options: [
      { label: "Orientation: Any", value: "" },
      { label: "Landscape", value: "landscape" },
      { label: "Portrait", value: "portrait" },
      { label: "Square", value: "square" },
    ],
  },
  color: {
    label: "Color",
    options: [
      { label: "Color: Any", value: "" },
      { label: "Red", value: "red" },
      { label: "Orange", value: "orange" },
      { label: "Yellow", value: "yellow" },
      { label: "Green", value: "green" },
      { label: "Turquoise", value: "turquoise" },
      { label: "Blue", value: "blue" },
      { label: "Violet", value: "violet" },
      { label: "Pink", value: "pink" },
      { label: "Brown", value: "brown" },
      { label: "Black", value: "black" },
      { label: "Gray", value: "gray" },
      { label: "White", value: "white" },
    ],
  },
  size: {
    label: "Size",
    options: [
      { label: "Size: Any", value: "" },
      { label: "Large (24MP)", value: "large" },
      { label: "Medium (12MP)", value: "medium" },
      { label: "Small (4MP)", value: "small" },
    ],
  },
  locale: {
    label: "Locale",
    options: [
      { label: "Locale: Any", value: "" },
      { label: "🇺🇸 English", value: "en-US" },
      { label: "🇧🇷 Portuguese", value: "pt-BR" },
      { label: "🇪🇸 Spanish", value: "es-ES" },
      { label: "🇩🇪 German", value: "de-DE" },
      { label: "🇮🇹 Italian", value: "it-IT" },
      { label: "🇫🇷 French", value: "fr-FR" },
      { label: "🇯🇵 Japanese", value: "ja-JP" },
      { label: "🇨🇳 Chinese", value: "zh-CN" },
      { label: "🇷🇺 Russian", value: "ru-RU" },
    ],
  },
};

interface FilterSelectProps {
  filterType: keyof MediaFilters;
  value: string;
  onChange: (value: string) => void;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  filterType,
  value,
  onChange,
}) => {
  const { label, options } = FILTER_DEFINITIONS[filterType];
  return (
    <div className="w-[200px]">
      {/* The label stays hidden visually but names the select for screen readers */}
      <InputSelect
        label={label}
        showLabel={false}
        options={options}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </div>
  );
};
