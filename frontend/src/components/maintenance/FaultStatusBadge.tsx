import React from 'react';
import { FaultStatus } from '@/types/maintenance';
import { CheckCircle2, Clock, Wrench, XCircle, FileQuestion } from 'lucide-react';

interface FaultStatusBadgeProps {
  status: FaultStatus;
  showIcon?: boolean;
  className?: string;
}

export const FaultStatusBadge: React.FC<FaultStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    FaultStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    OPEN: {
      label: 'Open / Un-triaged',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/20',
      icon: <Clock className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    TRIAGED: {
      label: 'Triaged',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/20',
      icon: <FileQuestion className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    IN_REPAIR: {
      label: 'In Repair',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      icon: <Wrench className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />,
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-teal-500/10 dark:bg-teal-500/15',
      text: 'text-teal-700 dark:text-teal-400',
      border: 'border-teal-500/20',
      icon: <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />,
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-muted/70',
      text: 'text-muted-foreground',
      border: 'border-border',
      icon: <XCircle className="w-3 h-3 text-muted-foreground" />,
    },
  };

  const config = configs[status] || configs.OPEN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
