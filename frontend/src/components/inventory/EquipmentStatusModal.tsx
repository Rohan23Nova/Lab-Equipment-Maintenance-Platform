import React, { useState } from 'react';
import { EquipmentConditionBadge, EquipmentStatusBadge } from '@/components/inventory/EquipmentBadges';
import { Button } from '@/components/ui/Button';
import { EquipmentDetail, EquipmentStatus, UpdateEquipmentStatusPayload } from '@/types/inventory';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface EquipmentStatusModalProps {
  equipment: EquipmentDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: EquipmentDetail) => void;
  onUpdateStatus: (id: string, payload: UpdateEquipmentStatusPayload) => Promise<EquipmentDetail>;
}

export const EquipmentStatusModal: React.FC<EquipmentStatusModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<EquipmentStatus>(equipment.status);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await onUpdateStatus(equipment.id, {
        status,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Operation Failed',
          status: 500,
          detail: 'Failed to update equipment status. Please try again.',
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
      aria-labelledby="status-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="status-modal-title" className="text-lg font-semibold text-foreground">
              Transition Operational Status
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Asset Tag: <span className="font-mono font-medium text-foreground">{equipment.assetTag}</span> — {equipment.name}
            </p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Current Operational Status
            </label>
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/60 flex items-center gap-3">
              <EquipmentStatusBadge status={equipment.status} />
              <EquipmentConditionBadge condition={equipment.condition} />
            </div>
          </div>

          <div>
            <label htmlFor="new-status" className="block text-xs font-medium text-foreground mb-1.5">
              Target Operational Status *
            </label>
            <select
              id="new-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="AVAILABLE">AVAILABLE (Operational & ready for reservations)</option>
              <option value="IN_USE">IN_USE (Currently engaged in active session)</option>
              <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE (Diagnostics / repair in progress)</option>
              <option value="RESERVED">RESERVED (Staged for confirmed booking)</option>
              <option value="ARCHIVED">ARCHIVED (Decommissioned from service)</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-reason" className="block text-xs font-medium text-foreground mb-1.5">
              Reason for State Change
            </label>
            <input
              id="status-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scheduled annual optics recalibration or laser fault"
              maxLength={255}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="status-notes" className="block text-xs font-medium text-foreground mb-1.5">
              Technical Audit Notes
            </label>
            <textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detailed technical observations, technician ticket reference, or inspection notes..."
              rows={3}
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" size="sm" isLoading={isSubmitting}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Commit Transition
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
