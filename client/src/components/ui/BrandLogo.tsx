import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-9 w-9',
  alt = 'BookLoop Logo',
}) => {
  return (
    <img
      src="/bookloop-logo.jpg"
      alt={alt}
      className={cn('object-contain rounded-xl flex-shrink-0 select-none', className)}
      draggable={false}
    />
  );
};
