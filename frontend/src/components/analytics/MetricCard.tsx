import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'accent' | 'warning' | 'critical' | 'success';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  description,
  icon: Icon,
  variant = 'default',
  trend,
  onClick,
}) => {
  const variantStyles = {
    default: 'border-border/80 bg-card hover:border-border text-foreground',
    accent: 'border-accent-lime/40 bg-card hover:border-accent-lime text-foreground',
    warning: 'border-amber-500/40 bg-card hover:border-amber-500 text-foreground',
    critical: 'border-rose-500/40 bg-card hover:border-rose-500 text-foreground',
    success: 'border-emerald-500/40 bg-card hover:border-emerald-500 text-foreground',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-muted/60',
    accent: 'text-accent-lime bg-accent-lime/10 border border-accent-lime/20',
    warning: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
    critical: 'text-rose-500 bg-rose-500/10 border border-rose-500/20',
    success: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all shadow-subtle ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-elevation-2' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
          {value}
        </span>
        {unit && <span className="text-xs text-muted-foreground font-medium">{unit}</span>}
      </div>

      {(description || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          {description && <p className="truncate">{description}</p>}
          {trend && (
            <span
              className={`font-medium ml-auto ${
                trend.direction === 'up'
                  ? 'text-emerald-500'
                  : trend.direction === 'down'
                  ? 'text-rose-500'
                  : 'text-muted-foreground'
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
