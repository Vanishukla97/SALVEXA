import { InputHTMLAttributes, forwardRef } from 'react';
import { Icon } from './Icon';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, rightIcon, onRightIconClick, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-sm font-label font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface w-full
              focus:ring-0 focus:outline-none focus:bg-surface-container-lowest focus:border-ghost
              transition-all duration-300 shadow-inner
              ${rightIcon ? 'pr-12' : ''}
              ${error ? 'ring-2 ring-error/50 bg-error-container/20' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              <Icon name={rightIcon} className="h-5 w-5" />
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-error font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
