import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { ReservationStatus } from '@/types/reservation';

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  className,
}) => {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge variant="available" withDot className={className}>
          Approved
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="calibration" withDot className={className}>
          Pending Review
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="maintenance" withDot className={className}>
          Rejected
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="neutral" withDot className={className}>
          Cancelled
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="neutral" className={className}>
          Completed
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
