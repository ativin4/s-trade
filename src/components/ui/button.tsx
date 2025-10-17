import React from 'react';
type ButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: string;
  size?: string;
  className?: string;
};
export function Button(props: ButtonProps) {
  return <button {...props}>{props.children}</button>;
}
