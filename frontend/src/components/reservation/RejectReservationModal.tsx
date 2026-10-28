import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ReservationSummary, Reservation } from '@/types/reservation';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { reservationApi } from '@/lib/reservationApi';
import { AlertCircle, XCircle, X } from 'lucide-react';

interface RejectReservationModalProps {
  reservation: ReservationSummary | Reservation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Reservation) => void;
}

export const RejectReservationModal: React.FC<RejectReservationModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await reservationApi.rejectReservation(reservation.id, reason.trim());
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Rejection Failed',
          status: 500,
          detail: 'Could not communicate with the reservation service.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5 shrink-0" />
            <h2 id="reject-modal-title" className="text-base font-semibold text-foreground">
              Reject Reservation Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{error.title}</p>
              <p>{error.detail}</p>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            You are declining the booking for <strong className="text-foreground">{reservation.equipmentName}</strong> requested by{' '}
            <strong className="text-foreground">{reservation.userFullName}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rejection-reason" className="block text-xs font-medium text-foreground mb-1.5">
              Reason for Decision *
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mandatory laser recalibration scheduled during this window, or missing prerequisite user training..."
              rows={3}
              required
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              Decline Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
