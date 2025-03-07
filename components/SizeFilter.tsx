import React from "react";
import { InputSelect } from "@uniformdev/design-system";

// Define the option interface
interface SizeOption {
  label: string;
  value: string;
}

// Define the props interface
interface SizeFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

// Size options for Pexels API
const sizeOptions: SizeOption[] = [
  { label: "Size: Any", value: "" },
  { label: "Large (24MP)", value: "large" },
  { label: "Medium (12MP)", value: "medium" },
  { label: "Small (4MP)", value: "small" },
];

const SizeFilter: React.FC<SizeFilterProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.currentTarget.value);
  };

  return (
    <div className="w-[200px]">
      <InputSelect
        label=""
        options={sizeOptions}
        value={value || ""}
        onChange={handleChange}
      />
    </div>
  );
};

export default SizeFilter;
