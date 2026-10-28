import React from 'react';
import { WorkOrderStatus } from '@/types/maintenance';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, UserCheck, XCircle } from 'lucide-react';

interface WorkOrderStatusBadgeProps {
  status: WorkOrderStatus;
  showIcon?: boolean;
  className?: string;
}

export const WorkOrderStatusBadge: React.FC<WorkOrderStatusBadgeProps> = ({
  status,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    WorkOrderStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    CREATED: {
      label: 'Created',
      bg: 'bg-muted/70',
      text: 'text-muted-foreground',
      border: 'border-border/80',
      icon: <Clock className="w-3 h-3 text-muted-foreground" />,
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-500/20',
      icon: <UserCheck className="w-3 h-3 text-sky-600 dark:text-sky-400" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      icon: <PlayCircle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />,
    },
    BLOCKED: {
      label: 'Blocked / On Hold',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400 font-semibold',
      border: 'border-amber-500/20',
      icon: <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-muted/70',
      text: 'text-muted-foreground',
      border: 'border-border',
      icon: <XCircle className="w-3 h-3 text-muted-foreground" />,
    },
  };

  const config = configs[status] || configs.CREATED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
