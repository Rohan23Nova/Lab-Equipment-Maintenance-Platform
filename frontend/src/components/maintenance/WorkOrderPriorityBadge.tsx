import React from 'react';
import { WorkOrderPriority } from '@/types/maintenance';
import { Flame, ShieldAlert, ArrowUp, ArrowDown } from 'lucide-react';

interface WorkOrderPriorityBadgeProps {
  priority: WorkOrderPriority;
  showIcon?: boolean;
  className?: string;
}

export const WorkOrderPriorityBadge: React.FC<WorkOrderPriorityBadgeProps> = ({
  priority,
  showIcon = true,
  className = '',
}) => {
  const configs: Record<
    WorkOrderPriority,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW: {
      label: 'Low Priority',
      bg: 'bg-muted/70',
      text: 'text-muted-foreground',
      border: 'border-border/80',
      icon: <ArrowDown className="w-3 h-3 text-muted-foreground" />,
    },
    MEDIUM: {
      label: 'Medium Priority',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-500/20',
      icon: <ArrowUp className="w-3 h-3 text-sky-600 dark:text-sky-400" />,
    },
    HIGH: {
      label: 'High Priority',
      bg: 'bg-orange-500/10 dark:bg-orange-500/15',
      text: 'text-orange-700 dark:text-orange-400 font-semibold',
      border: 'border-orange-500/20',
      icon: <ShieldAlert className="w-3 h-3 text-orange-600 dark:text-orange-400" />,
    },
    URGENT: {
      label: 'Urgent / Emergency',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400 font-bold',
      border: 'border-rose-500/30',
      icon: <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
  };

  const config = configs[priority] || configs.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
