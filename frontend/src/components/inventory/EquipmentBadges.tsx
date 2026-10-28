import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { EquipmentCondition, EquipmentStatus } from '@/types/inventory';

interface EquipmentStatusBadgeProps {
  status: EquipmentStatus;
  className?: string;
}

export const EquipmentStatusBadge: React.FC<EquipmentStatusBadgeProps> = ({ status, className }) => {
  switch (status) {
    case 'AVAILABLE':
      return (
        <Badge variant="available" withDot className={className}>
          Available
        </Badge>
      );
    case 'IN_USE':
      return (
        <Badge variant="inuse" withDot className={className}>
          In Use
        </Badge>
      );
    case 'UNDER_MAINTENANCE':
      return (
        <Badge variant="maintenance" withDot className={className}>
          Under Maintenance
        </Badge>
      );
    case 'RESERVED':
      return (
        <Badge variant="calibration" withDot className={className}>
          Reserved
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="neutral" withDot className={className}>
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" className={className}>
          {status}
        </Badge>
      );
  }
};

interface EquipmentConditionBadgeProps {
  condition: EquipmentCondition;
  className?: string;
}

export const EquipmentConditionBadge: React.FC<EquipmentConditionBadgeProps> = ({
  condition,
  className,
}) => {
  switch (condition) {
    case 'NEW':
      return (
        <Badge variant="lime" className={className}>
          New
        </Badge>
      );
    case 'EXCELLENT':
      return (
        <Badge variant="available" className={className}>
          Excellent
        </Badge>
      );
    case 'GOOD':
      return (
        <Badge variant="available" className={className}>
          Good
        </Badge>
      );
    case 'FAIR':
      return (
        <Badge variant="calibration" className={className}>
          Fair
        </Badge>
      );
    case 'POOR':
      return (
        <Badge variant="maintenance" className={className}>
          Poor
        </Badge>
      );
    case 'DAMAGED':
      return (
        <Badge variant="maintenance" className={className}>
          Damaged
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" className={className}>
          {condition}
        </Badge>
      );
  }
};
