import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ children, ...props }) => (
  <select {...props} className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-500 focus:border-indigo-500">
    {children}
  </select>
);

export interface SelectTriggerProps {
  children: React.ReactNode;
}
export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children }) => <>{children}</>;

export interface SelectValueProps {
  placeholder?: string;
}
export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => (
  <span className="text-gray-500">{placeholder}</span>
);

export interface SelectContentProps {
  children: React.ReactNode;
}
export const SelectContent: React.FC<SelectContentProps> = ({ children }) => <>{children}</>;

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string;
  children: React.ReactNode;
}
export const SelectItem: React.FC<SelectItemProps> = ({ value, children, ...props }) => (
  <option value={value} {...props}>{children}</option>
);
