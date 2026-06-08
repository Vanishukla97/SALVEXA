import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-sm font-label font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface
            focus:ring-0 focus:outline-none focus:bg-surface-container-lowest focus:border-ghost
            transition-all duration-300 shadow-inner
            ${error ? 'ring-2 ring-error/50 bg-error-container/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-error font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
