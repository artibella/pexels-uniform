import React from "react";
import { DebouncedInputKeywordSearch } from "@uniformdev/design-system";

export const SEARCH_INPUT_NAME = "searchTerm";

interface SearchProps {
  /** Initial value; the input is uncontrolled and keeps its own text */
  defaultValue?: string;
  /** Called with the typed text once typing pauses */
  onSearchTextChanged: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
}

const Search: React.FC<SearchProps> = ({
  defaultValue = "",
  onSearchTextChanged,
  placeholder,
  className,
  "aria-label": ariaLabel,
  autoFocus = false,
}) => (
  <div className={className || "flex-grow"}>
    <DebouncedInputKeywordSearch
      defaultValue={defaultValue}
      delay={300}
      inputFieldName={SEARCH_INPUT_NAME}
      onSearchTextChanged={onSearchTextChanged}
      placeholder={placeholder || "Search for ..."}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
    />
  </div>
);

export default Search;
