import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { AuditAction } from '@/types/audit';

interface AuditActionBadgeProps {
  action: AuditAction;
}

export const AuditActionBadge: React.FC<AuditActionBadgeProps> = ({ action }) => {
  const getBadgeConfig = (action: AuditAction): { variant: 'available' | 'inuse' | 'maintenance' | 'calibration' | 'neutral' | 'lime'; label: string } => {
    switch (action) {
      case 'EQUIPMENT_CREATED':
      case 'RESERVATION_CREATED':
      case 'USER_CREATED':
      case 'WORK_ORDER_CREATED':
        return { variant: 'available', label: action.replace('_', ' ') };

      case 'RESERVATION_APPROVED':
      case 'EQUIPMENT_RETURNED_TO_SERVICE':
      case 'FAULT_RESOLVED':
      case 'WORK_ORDER_COMPLETED':
        return { variant: 'lime', label: action.replace('_', ' ') };

      case 'EQUIPMENT_UPDATED':
      case 'WORK_ORDER_PROGRESS_UPDATED':
      case 'WORK_ORDER_ASSIGNED':
      case 'USER_STATUS_UPDATED':
      case 'FAULT_TRIAGED':
        return { variant: 'inuse', label: action.replace('_', ' ') };

      case 'RESERVATION_CANCELLED':
      case 'RESERVATION_REJECTED':
      case 'EQUIPMENT_ARCHIVED':
      case 'FAULT_CLOSED':
        return { variant: 'neutral', label: action.replace('_', ' ') };

      case 'FAULT_REPORTED':
        return { variant: 'calibration', label: action.replace('_', ' ') };

      case 'EQUIPMENT_STATUS_CHANGED':
        return { variant: 'calibration', label: action.replace('_', ' ') };

      default:
        return { variant: 'neutral', label: action.replace('_', ' ') };
    }
  };

  const { variant, label } = getBadgeConfig(action);

  return (
    <Badge variant={variant} withDot className="font-mono text-[11px] uppercase tracking-wider">
      {label}
    </Badge>
  );
};
