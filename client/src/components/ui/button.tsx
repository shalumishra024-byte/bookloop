import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isActive?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isActive = false, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F67280] disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]';

    const primaryButtonStyle =
      'bg-[#F67280] text-white border border-[#F67280] shadow-sm [@media(hover:hover)]:hover:bg-[#FFB7A5] [@media(hover:hover)]:hover:text-[#355C7D] [@media(hover:hover)]:hover:border-[#F67280] active:bg-[#E05A69] active:text-white active:border-[#E05A69]';

    const secondaryButtonStyle =
      'bg-[#6C5B7B] text-white border border-[#6C5B7B] shadow-sm [@media(hover:hover)]:hover:bg-[#FFB7A5] [@media(hover:hover)]:hover:text-[#355C7D] [@media(hover:hover)]:hover:border-[#6C5B7B] active:bg-[#574865] active:text-white';

    const outlineButtonStyle =
      'bg-white text-[#6C5B7B] border border-[#FFB7A5] shadow-sm [@media(hover:hover)]:hover:bg-[#FFB7A5] [@media(hover:hover)]:hover:text-[#355C7D] [@media(hover:hover)]:hover:border-[#F67280] active:bg-[#F67280] active:text-white';

    const variants = {
      default: primaryButtonStyle,
      secondary: secondaryButtonStyle,
      outline: outlineButtonStyle,
      destructive:
        'bg-destructive text-destructive-foreground border border-destructive shadow-sm [@media(hover:hover)]:hover:bg-[#FFB7A5] [@media(hover:hover)]:hover:text-[#355C7D] [@media(hover:hover)]:hover:border-destructive active:bg-destructive/90 active:text-white',
      ghost:
        'bg-transparent text-[#355C7D] [@media(hover:hover)]:hover:bg-[#FFB7A5]/60 [@media(hover:hover)]:hover:text-[#355C7D] active:bg-[#FFB7A5] active:text-[#355C7D]',
      link: 'text-[#F67280] underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-10 rounded-lg px-8 text-base',
      icon: 'h-9 w-9',
    };

    const activeClass =
      isActive && variant !== 'link'
        ? '!bg-[#F67280] !text-white !border-[#F67280]'
        : '';

    return (
      <button
        data-active={isActive ? 'true' : 'false'}
        className={cn(baseStyles, variants[variant], sizes[size], activeClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
