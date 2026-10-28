import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ReservationSummary, Reservation } from '@/types/reservation';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { reservationApi } from '@/lib/reservationApi';
import { AlertTriangle, X } from 'lucide-react';

interface CancelReservationModalProps {
  reservation: ReservationSummary | Reservation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Reservation) => void;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('Experiment completed or schedule change');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await reservationApi.cancelReservation(reservation.id, reason.trim());
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Cancellation Failed',
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
      aria-labelledby="cancel-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 id="cancel-modal-title" className="text-base font-semibold text-foreground">
              Cancel Scheduled Reservation
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
            <p>{error.detail}</p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            Cancel booking for <strong className="text-foreground">{reservation.equipmentName}</strong> (
            <span className="font-mono text-foreground">{reservation.equipmentAssetTag}</span>).
          </p>
          <p className="mt-2 text-foreground font-medium">
            This slot will be immediately released and made available for other researchers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="cancel-reason" className="block text-xs font-medium text-foreground mb-1.5">
              Cancellation Reason (Optional)
            </label>
            <input
              id="cancel-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Experiment postponed or reagent delayed"
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Keep Reservation
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
