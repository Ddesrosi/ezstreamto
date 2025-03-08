import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700': variant === 'primary',
            'bg-[#0A1A3F] text-blue-100 border border-blue-900/30 hover:border-blue-400/40 active:bg-[#102347]': variant === 'secondary',
            'text-blue-300/70 hover:text-blue-200 hover:bg-blue-400/5': variant === 'ghost',
            'h-9 px-2.5 text-xs sm:h-10 sm:px-3 sm:text-sm': size === 'sm',
            'h-10 px-3 text-sm sm:h-12 sm:px-4 sm:text-base': size === 'md',
            'h-12 px-4 text-base sm:h-14 sm:px-6 sm:text-lg': size === 'lg',
          },
          'min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]', // Ensure minimum touch target size
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };