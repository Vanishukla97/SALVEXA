import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-display font-bold transition-all active:scale-[.98] rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      primary: 'bg-primary text-on-primary shadow-md shadow-primary/15 hover:bg-primary-container hover:shadow-lg',
      secondary: 'bg-white border border-outline-variant/60 text-on-surface hover:bg-surface-container-low',
      tertiary: 'text-primary hover:text-primary-container',
      danger: 'bg-error text-on-error shadow-sm hover:bg-error/90',
    };
    
    const sizes = {
      sm: 'px-3.5 py-2 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
