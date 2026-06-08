import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'rounded-[2rem] transition-all duration-500';
    
    const variants = {
      default: 'bg-surface-container-low hover:bg-surface-container-lowest shadow-sm hover:shadow-xl hover:-translate-y-2',
      glass: 'glass-card border border-outline-variant/10 shadow-2xl',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
