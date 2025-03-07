import React from "react";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "@uniformdev/design-system";

// Define the props interface
interface OrientationFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

// Orientation options for Pexels API
const orientationOptions: SegmentedControlOption[] = [
  { label: "Any", value: "", icon: "collage" },
  { label: "Landscape", value: "landscape", icon: "rectangle-rounded" },
  { label: "Portrait", value: "portrait", icon: "device-mobile" },
  { label: "Square", value: "squarish", icon: "border-all" },
];

const OrientationFilter: React.FC<OrientationFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="w-[490px]">
      <SegmentedControl
        name="orientation-filter"
        options={orientationOptions}
        value={value || ""}
        onChange={onChange}
        size="lg"
        noCheckmark
      />
    </div>
  );
};

export default OrientationFilter;
