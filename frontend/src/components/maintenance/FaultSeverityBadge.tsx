import React from 'react';
import { FaultSeverity } from '@/types/maintenance';
import { AlertCircle, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface FaultSeverityBadgeProps {
  severity: FaultSeverity;
  showIcon?: boolean;
  className?: string;
}

export const FaultSeverityBadge: React.FC<FaultSeverityBadgeProps> = ({
  severity,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    FaultSeverity,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW: {
      label: 'Low Severity',
      bg: 'bg-muted/70',
      text: 'text-muted-foreground',
      border: 'border-border/80',
      icon: <Info className="w-3 h-3 text-muted-foreground" />,
    },
    MEDIUM: {
      label: 'Medium Severity',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/20',
      icon: <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    HIGH: {
      label: 'High Severity',
      bg: 'bg-orange-500/10 dark:bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/20',
      icon: <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
    },
    CRITICAL: {
      label: 'Critical / Lockdown',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400 font-bold',
      border: 'border-rose-500/30',
      icon: <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
  };

  const config = configs[severity] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
