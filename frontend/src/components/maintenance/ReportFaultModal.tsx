import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { CreateFaultReportPayload, FaultReport, FaultSeverity } from '@/types/maintenance';
import { AlertCircle, AlertOctagon, AlertTriangle, X } from 'lucide-react';

interface ReportFaultModalProps {
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fault: FaultReport) => void;
}

export const ReportFaultModal: React.FC<ReportFaultModalProps> = ({
  equipmentId,
  equipmentName,
  equipmentAssetTag,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<FaultSeverity>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const payload: CreateFaultReportPayload = {
      equipmentId,
      title: title.trim(),
      description: description.trim(),
      severity,
    };

    try {
      const created = await maintenanceApi.reportFault(payload);
      onSuccess(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Fault Report Failed',
          status: 500,
          detail: 'An error occurred while submitting your fault report. Please try again.',
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
      aria-labelledby="report-fault-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="report-fault-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report Equipment Fault
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-foreground">{equipmentAssetTag}</span> — {equipmentName}
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

        {/* Error notification */}
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
          {/* Fault Title */}
          <div>
            <label htmlFor="fault-title" className="block text-xs font-medium text-foreground mb-1.5">
              Fault Summary Title *
            </label>
            <input
              id="fault-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laser emission diode failure or temperature regulation error"
              required
              maxLength={200}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Incident Severity Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as FaultSeverity[]).map((level) => {
                const isSelected = severity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors text-center ${
                      isSelected
                        ? level === 'CRITICAL'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-400 font-bold ring-1 ring-rose-500'
                          : 'bg-accent-lime text-ink-950 border-accent-lime font-bold shadow-sm'
                        : 'border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Critical policy warning notice */}
          {severity === 'CRITICAL' && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>CRITICAL SEVERITY LOCKDOWN POLICY</span>
              </div>
              <p className="leading-relaxed">
                Submitting a <strong>CRITICAL</strong> fault will immediately place this instrument under maintenance lockdown (<code>UNDER_MAINTENANCE</code>) and automatically cancel upcoming reservations to safeguard laboratory operations.
              </p>
            </div>
          )}

          {/* Detailed Description */}
          <div>
            <label htmlFor="fault-desc" className="block text-xs font-medium text-foreground mb-1.5">
              Detailed Description & Observation *
            </label>
            <textarea
              id="fault-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, any error codes displayed on instrument screen, and what steps reproduced the defect..."
              rows={4}
              required
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={severity === 'CRITICAL' ? 'danger' : 'primary'}
              size="sm"
              isLoading={isSubmitting}
            >
              Submit Fault Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
