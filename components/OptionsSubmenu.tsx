import React from "react";
import { Icon, IconType, Menu, MenuItem, Tooltip } from "@uniformdev/design-system";

export type SubmenuOption = {
  /** Photo size key or video file id */
  variant: string;
  label: string;
  description: string;
};

interface OptionsSubmenuProps {
  label: string;
  icon: IconType;
  options: SubmenuOption[];
  onSelect: (option: SubmenuOption) => void;
  /** Shows the entry disabled, with this reason as its tooltip */
  disabledReason?: string;
}

const triggerLabel = (label: string, icon: IconType, showChevron: boolean) => (
  <span className="flex w-full items-center gap-2">
    <Icon size={12} icon={icon} color="black" />
    <span className="flex-1">{label}</span>
    {showChevron && <Icon size={12} icon="chevron-right" color="black" />}
  </span>
);

/** A menu entry that opens a nested menu with one item per resolution */
export const OptionsSubmenu: React.FC<OptionsSubmenuProps> = ({
  label,
  icon,
  options,
  onSelect,
  disabledReason,
}) => {
  if (disabledReason || options.length === 0) {
    // A disabled submenu can't explain itself, so render a plain item with a tooltip
    return (
      <Tooltip title={disabledReason ?? "No files available"} placement="left">
        <MenuItem disabled>{triggerLabel(label, icon, false)}</MenuItem>
      </Tooltip>
    );
  }

  return (
    <Menu
      placement="right-start"
      menuTrigger={<MenuItem>{triggerLabel(label, icon, true)}</MenuItem>}
    >
      {options.map((option) => (
        <Tooltip key={option.variant} title={option.description} placement="right">
          <MenuItem onClick={() => onSelect(option)}>{option.label}</MenuItem>
        </Tooltip>
      ))}
    </Menu>
  );
};
