import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isActive?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isActive = false, onClick, ...props }, ref) => {
    const [isClicked, setIsClicked] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsClicked(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsClicked(false), 220);
      onClick?.(e);
    };

    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CE6F87] disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]';

    const variants = {
      default:
        'bg-[#F8DBBD] text-[#2D161D] border border-[#E8C4A0] shadow-sm hover:bg-[#F3CFA9] active:bg-[#CE6F87] active:text-white active:border-[#CE6F87]',
      destructive:
        'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-[#CE6F87] active:text-white',
      outline:
        'border border-[#E8C4A0] bg-[#F8DBBD]/45 text-foreground shadow-sm hover:bg-[#F8DBBD] hover:text-[#2D161D] active:bg-[#CE6F87] active:text-white active:border-[#CE6F87]',
      secondary:
        'bg-[#F8DBBD]/80 text-[#2D161D] border border-[#E8C4A0]/80 shadow-sm hover:bg-[#F8DBBD] active:bg-[#CE6F87] active:text-white active:border-[#CE6F87]',
      ghost:
        'hover:bg-[#F8DBBD] hover:text-[#2D161D] active:bg-[#CE6F87] active:text-white',
      link: 'text-[#CE6F87] underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-base',
      icon: 'h-9 w-9',
    };

    const activePinkClass =
      (isActive || isClicked) && variant !== 'link'
        ? '!bg-[#CE6F87] !text-white !border-[#CE6F87]'
        : '';

    return (
      <button
        data-pressed={isActive || isClicked ? 'true' : 'false'}
        className={cn(baseStyles, variants[variant], sizes[size], activePinkClass, className)}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
