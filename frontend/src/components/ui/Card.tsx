import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive' | 'accent';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'glass', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-slate-900/90 border border-slate-800 shadow-lg',
      elevated: 'bg-slate-800/80 border border-slate-700/60 shadow-xl backdrop-blur-md',
      glass: 'glass-panel rounded-2xl',
      interactive: 'glass-panel-interactive rounded-2xl cursor-pointer',
      accent: 'bg-gradient-to-b from-sky-950/40 to-slate-900/80 border border-sky-500/30 rounded-2xl shadow-xl shadow-sky-950/20',
    }[variant];

    return (
      <div
        ref={ref}
        className={`p-5 sm:p-6 transition-colors duration-200 ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
