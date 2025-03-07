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
  { label: "🇺🇸 English", value: "en-US" },
  { label: "🇧🇷 Portuguese", value: "pt-BR" },
  { label: "🇪🇸 Spanish", value: "es-ES" },
  { label: "🇩🇪 German", value: "de-DE" },
  { label: "🇮🇹 Italian", value: "it-IT" },
  { label: "🇫🇷 French", value: "fr-FR" },
  { label: "🇯🇵 Japanese", value: "ja-JP" },
  { label: "🇨🇳 Chinese", value: "zh-CN" },
  { label: "🇷🇺 Russian", value: "ru-RU" },
];

const LocaleFilter: React.FC<LocaleFilterProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.currentTarget.value);
  };

  return (
    <div className="w-[200px]">
      <InputSelect
        label="Locale"
        showLabel={false}
        options={localeOptions}
        value={value || ""}
        onChange={handleChange}
      />
    </div>
  );
};

export default LocaleFilter;
