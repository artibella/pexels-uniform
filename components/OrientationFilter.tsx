import React from "react";
import {
  InputSelect,
  SegmentedControl,
  SegmentedControlOption,
} from "@uniformdev/design-system";

// Define the props interface
interface OrientationFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

// Define the option interface
interface OrientationOption {
  label: string;
  value: string;
}

// Orientation options for Pexels API
const orientationOptions: OrientationOption[] = [
  { label: "Orientation: Any", value: "" },
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "Square", value: "squarish" },
];

const OrientationFilter: React.FC<OrientationFilterProps> = ({
  value,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Pass the value to the parent component
    onChange(e.currentTarget.value);
  };

  return (
    <div className="w-[200px]">
      <InputSelect
        label="Orientation"
        showLabel={false}
        options={orientationOptions}
        value={value || ""}
        onChange={handleChange}
      />
    </div>
  );
};

export default OrientationFilter;
