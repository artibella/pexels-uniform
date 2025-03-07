import React, { useEffect, useState } from "react";
import { DebouncedInputKeywordSearch } from "@uniformdev/design-system";

// Define the interface for Search component props
interface SearchProps {
  value?: string;
  onSearchTextChanged?: (event: { target: { value: string } } | string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

const Search: React.FC<SearchProps> = ({
  value,
  onSearchTextChanged,
  placeholder,
  className,
  "aria-label": ariaLabel,
}) => {
  // We'll use the standard Uniform design system component but wrap it
  // with our own state management to maintain the debounce behavior
  const [localValue, setLocalValue] = useState(value || "");

  // Update local value when prop value changes
  useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const handleSearchChange = (newValue: string) => {
    // This is called by the Uniform component after its internal debounce
    if (onSearchTextChanged) {
      // Create a synthetic event-like object to maintain compatibility
      // with event handlers expecting e.target.value
      onSearchTextChanged({
        target: { value: newValue },
      });
    }
  };

  return (
    <div className={className || "flex-grow"}>
      <DebouncedInputKeywordSearch
        defaultValue={localValue}
        delay={300} // Shorter delay for better user experience
        inputFieldName="searchTerm"
        onSearchTextChanged={handleSearchChange}
        placeholder={placeholder || "Search for ..."}
        aria-label={ariaLabel}
      />
    </div>
  );
};

export default Search;
