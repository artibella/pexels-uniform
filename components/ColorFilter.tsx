import React from "react";
import { InputSelect } from "@uniformdev/design-system";
import clsx from "clsx";

// Define the option interface
interface ColorOption {
  label: string;
  value: string;
}

// Define the props interface
interface ColorFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

// Color options for Pexels API
const colorOptions: ColorOption[] = [
  { label: "Color: Any", value: "" },
  { label: "Black and white", value: "black_and_white" },
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
  { label: "Yellow", value: "yellow" },
  { label: "Orange", value: "orange" },
  { label: "Red", value: "red" },
  { label: "Purple", value: "purple" },
  { label: "Magenta", value: "magenta" },
  { label: "Green", value: "green" },
  { label: "Teal", value: "teal" },
  { label: "Blue", value: "blue" },
];

const ColorFilter: React.FC<ColorFilterProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Pass the value to the parent component
    onChange(e.currentTarget.value);
  };

  return (
    <div className="w-[250px]">
      <InputSelect
        label=""
        options={colorOptions}
        value={value || ""}
        onChange={handleChange}
        compact
      />
    </div>
  );
};

export default ColorFilter;
