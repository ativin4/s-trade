import {
  Select as MuiSelect,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import type { SelectProps, MenuItemProps } from "@mui/material";
import React from "react";

const Select: React.FC<SelectProps> = (props) => <MuiSelect {...props} />;
const SelectItem: React.FC<MenuItemProps> = (props) => <MuiMenuItem {...props} />;

// The following components are not directly equivalent in MUI,
// but are exported for compatibility.
// The developer will need to refactor the usage.
const SelectTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => <>{placeholder}</>;
const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;


export { Select, SelectItem, SelectTrigger, SelectValue, SelectContent };
