import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { FaultReport, FaultStatus, TriageFaultReportPayload } from '@/types/maintenance';
import { AlertCircle, FileCheck, X } from 'lucide-react';

interface TriageFaultModalProps {
  fault: FaultReport;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: FaultReport) => void;
}

export const TriageFaultModal: React.FC<TriageFaultModalProps> = ({
  fault,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<FaultStatus>('TRIAGED');
  const [triageNotes, setTriageNotes] = useState('');
  const [placeUnderMaintenance, setPlaceUnderMaintenance] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: TriageFaultReportPayload = {
      status,
      triageNotes: triageNotes.trim() || undefined,
      placeUnderMaintenance,
    };

    try {
      const updated = await maintenanceApi.triageFault(fault.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Triage Submission Failed',
          status: 500,
          detail: 'An error occurred while saving triage notes. Please try again.',
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
      aria-labelledby="triage-modal-title"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="triage-modal-title" className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-accent-lime" />
              Triage Fault Report
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {fault.faultNumber} — {fault.equipmentAssetTag}
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
            <p>{error.detail}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Decision Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FaultStatus)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="TRIAGED">TRIAGED (Valid fault verified, proceed with repair)</option>
              <option value="REJECTED">REJECTED (Not a genuine defect / operator error)</option>
            </select>
          </div>

          <div>
            <label htmlFor="triage-notes" className="block text-xs font-medium text-foreground mb-1.5">
              Triage Notes & Assessment
            </label>
            <textarea
              id="triage-notes"
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              placeholder="e.g. Verified sensor disconnect. Work order required for wiring harness replacement."
              rows={3}
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {status === 'TRIAGED' && (
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/60 cursor-pointer">
              <input
                type="checkbox"
                checked={placeUnderMaintenance}
                onChange={(e) => setPlaceUnderMaintenance(e.target.checked)}
                className="mt-0.5 rounded border-border text-accent-lime focus:ring-accent-lime"
              />
              <div className="text-xs">
                <span className="font-semibold text-foreground block">
                  Place instrument into Maintenance Lockdown (UNDER_MAINTENANCE)
                </span>
                <span className="text-muted-foreground mt-0.5 block">
                  Protects instrument by cancelling conflicting active reservations and disabling new bookings until certified.
                </span>
              </div>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Record Triage Decision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
