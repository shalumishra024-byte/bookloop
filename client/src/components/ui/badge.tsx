import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-[#F67280] text-white shadow-sm',
    secondary: 'border border-[#FFB7A5] bg-[#FFB7A5]/55 text-[#355C7D]',
    outline: 'border border-[#FFB7A5] bg-white/80 text-[#355C7D]',
    success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    destructive: 'border-transparent bg-destructive/15 text-destructive border border-destructive/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
