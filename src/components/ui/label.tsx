import { FormLabel } from "@mui/material";
import type { FormLabelProps } from "@mui/material";
import React from "react";

const Label: React.FC<FormLabelProps> = (props) => {
  return <FormLabel {...props} />;
};

export { Label };
