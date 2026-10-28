import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentDetail } from '@/types/inventory';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { AlertTriangle, Archive, X } from 'lucide-react';

interface ArchiveEquipmentModalProps {
  equipment: EquipmentDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: EquipmentDetail) => void;
  onArchive: (id: string, reason?: string) => Promise<EquipmentDetail>;
}

export const ArchiveEquipmentModal: React.FC<ArchiveEquipmentModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
  onArchive,
}) => {
  const [reason, setReason] = useState('Decommissioned from university service');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await onArchive(equipment.id, reason.trim());
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Archive Failed',
          status: 500,
          detail: 'Could not archive equipment. Please try again.',
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
      aria-labelledby="archive-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 id="archive-modal-title" className="text-base font-semibold text-foreground">
              Decommission Instrument
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
          <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs">
            <p className="font-semibold">{error.title}</p>
            <p>{error.detail}</p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            You are decommissioning <strong className="text-foreground">{equipment.name}</strong> (Asset Tag:{' '}
            <span className="font-mono text-foreground font-medium">{equipment.assetTag}</span>).
          </p>
          <p className="mt-2 text-foreground font-medium">
            Non-Destructive Lifecycle Operation:
          </p>
          <p className="mt-1">
            This instrument will not be permanently deleted. Its maintenance history, reservation records, and audit logs remain preserved in the institutional ledger while preventing new bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="archive-reason" className="block text-xs font-medium text-foreground mb-1.5">
              Decommission Reason *
            </label>
            <input
              id="archive-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. End of lifecycle, irreparable hardware fault, or laboratory upgrade"
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" isLoading={isSubmitting}>
              <Archive className="w-4 h-4 mr-1.5" />
              Decommission & Archive
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
