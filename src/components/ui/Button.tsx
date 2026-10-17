import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-display font-bold transition-transform active:scale-95 rounded-xl';
    
    const variants = {
      primary: 'bg-hero-gradient text-on-primary shadow-xl shadow-primary/30',
      secondary: 'bg-surface-container-high text-primary hover:bg-surface-container-highest',
      tertiary: 'text-primary hover:text-primary-container',
      danger: 'bg-error text-on-error shadow-lg shadow-error/20 hover:bg-error/90',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
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
