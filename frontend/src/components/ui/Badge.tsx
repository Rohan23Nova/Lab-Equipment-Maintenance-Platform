import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'available' | 'inuse' | 'maintenance' | 'calibration' | 'neutral' | 'lime' | 'outline';
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  withDot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    available:
      'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    inuse:
      'bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
    maintenance:
      'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    calibration:
      'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    neutral:
      'bg-muted text-muted-foreground border-border/70',
    lime:
      'bg-accent-lime/15 text-zinc-900 border-accent-lime/40 dark:bg-accent-lime/20 dark:text-lime-300 dark:border-accent-lime/30 font-semibold',
    outline:
      'border-border text-foreground bg-transparent',
  };

  const dotStyles = {
    available: 'bg-emerald-500',
    inuse: 'bg-blue-500',
    maintenance: 'bg-rose-500',
    calibration: 'bg-amber-500',
    neutral: 'bg-muted-foreground',
    lime: 'bg-accent-lime',
    outline: 'bg-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border select-none transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
