import React from "react";
import { InputSelect } from "@uniformdev/design-system";

// Define the option interface
interface LocaleOption {
  label: string;
  value: string;
}

// Define the props interface
interface LocaleFilterProps {
  value?: string;
  onChange: (value: string) => void;
}

// Locale options for Pexels API
const localeOptions: LocaleOption[] = [
  { label: "Locale: Any", value: "" },
  { label: "English (US)", value: "en-US" },
  { label: "Portuguese (BR)", value: "pt-BR" },
  { label: "Spanish (ES)", value: "es-ES" },
  { label: "German (DE)", value: "de-DE" },
  { label: "Italian (IT)", value: "it-IT" },
  { label: "French (FR)", value: "fr-FR" },
  { label: "Japanese (JP)", value: "ja-JP" },
  { label: "Chinese (CN)", value: "zh-CN" },
  { label: "Russian (RU)", value: "ru-RU" },
];

const LocaleFilter: React.FC<LocaleFilterProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.currentTarget.value);
  };

  return (
    <div className="w-[200px]">
      <InputSelect
        label=""
        options={localeOptions}
        value={value || ""}
        onChange={handleChange}
      />
    </div>
  );
};

export default LocaleFilter;
