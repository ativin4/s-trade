import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import React from 'react';

interface BadgeProps extends Omit<ChipProps, 'variant'> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge: React.FC<BadgeProps> = ({ variant, ...props }) => {
  let color: ChipProps['color'] = 'default';
  let chipVariant: ChipProps['variant'] = 'filled';

  switch (variant) {
    case 'secondary':
      color = 'secondary';
      break;
    case 'destructive':
      color = 'error';
      break;
    case 'outline':
      chipVariant = 'outlined';
      break;
  }

  return <Chip color={color} variant={chipVariant} {...props} />;
};

export { Badge };
