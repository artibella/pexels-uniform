import React from "react";
import { DebouncedInputKeywordSearch } from "@uniformdev/design-system";

// Define the interface for Search component props
interface SearchProps {
  value?: string;
  onSearchTextChanged?: (event: { target: { value: string } } | string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
}

const Search: React.FC<SearchProps> = ({
  value = "",
  onSearchTextChanged,
  placeholder,
  className,
  "aria-label": ariaLabel,
  autoFocus = false,
}) => {
  // Handle search changes from the Uniform component
  const handleSearchChange = (newValue: string) => {
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
        defaultValue={value}
        delay={300}
        inputFieldName="searchTerm"
        onSearchTextChanged={handleSearchChange}
        placeholder={placeholder || "Search for ..."}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        rounded
      />
    </div>
  );
};

export default Search;
