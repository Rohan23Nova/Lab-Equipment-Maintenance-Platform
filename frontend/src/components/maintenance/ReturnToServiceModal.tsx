import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { MaintenanceWorkOrder, ReturnToServicePayload } from '@/types/maintenance';
import { AlertCircle, CheckCircle2, ShieldCheck, X, XCircle } from 'lucide-react';

interface ReturnToServiceModalProps {
  workOrder: MaintenanceWorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: MaintenanceWorkOrder) => void;
}

export const ReturnToServiceModal: React.FC<ReturnToServiceModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passedInspection, setPassedInspection] = useState(true);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionNotes.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const payload: ReturnToServicePayload = {
      passedInspection,
      inspectionNotes: inspectionNotes.trim(),
      returnEquipmentToAvailable: passedInspection,
    };

    try {
      const updated = await maintenanceApi.returnToService(workOrder.id, payload);
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Return-to-Service Failed',
          status: 500,
          detail: 'Could not record inspection outcome. Please try again.',
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
      aria-labelledby="return-service-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="return-service-title" className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent-lime" />
              Return-to-Service Inspection & Certification
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-foreground">{workOrder.workOrderNumber}</span> — {workOrder.equipmentName} ({workOrder.equipmentAssetTag})
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
              Inspection Outcome *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPassedInspection(true)}
                className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-2.5 ${
                  passedInspection
                    ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-muted/20 border-border/70 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold block text-foreground">Inspection Passed</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Certify repairs, close linked fault, and return instrument to AVAILABLE status.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPassedInspection(false)}
                className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-2.5 ${
                  !passedInspection
                    ? 'bg-rose-500/10 border-rose-500/80 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/50'
                    : 'bg-muted/20 border-border/70 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <XCircle className="w-4 h-4 mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold block text-foreground">Inspection Failed</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Reopen work order as IN_PROGRESS and retain instrument in UNDER_MAINTENANCE.
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="inspect-notes" className="block text-xs font-medium text-foreground mb-1.5">
              Inspection Notes & Benchmark Certification *
            </label>
            <textarea
              id="inspect-notes"
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Record diagnostic benchmarks executed (e.g. baseline calibration, optical accuracy, acoustic scan) and safety sign-off..."
              rows={4}
              required
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={passedInspection ? 'primary' : 'danger'}
              size="sm"
              isLoading={isSubmitting}
            >
              {passedInspection ? 'Authorize Return to Service' : 'Reject Inspection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
