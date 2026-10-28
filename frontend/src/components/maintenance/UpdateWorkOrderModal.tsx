import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { maintenanceApi } from '@/lib/maintenanceApi';
import {
  MaintenanceWorkOrder,
  UpdateWorkOrderProgressPayload,
  WorkOrderStatus,
} from '@/types/maintenance';
import { AlertCircle, Clock, DollarSign, Wrench, X } from 'lucide-react';

interface UpdateWorkOrderModalProps {
  workOrder: MaintenanceWorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: MaintenanceWorkOrder) => void;
}

export const UpdateWorkOrderModal: React.FC<UpdateWorkOrderModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<WorkOrderStatus>(
    workOrder.status === 'CREATED' || workOrder.status === 'ASSIGNED'
      ? 'IN_PROGRESS'
      : workOrder.status
  );
  const [blockedReason, setBlockedReason] = useState(workOrder.blockedReason || '');
  const [laborHours, setLaborHours] = useState<number | undefined>(workOrder.laborHours || 0);
  const [partsCost, setPartsCost] = useState<number | undefined>(workOrder.partsCost || 0);
  const [resolutionSummary, setResolutionSummary] = useState(workOrder.resolutionSummary || '');
  const [progressNote, setProgressNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'BLOCKED' && !blockedReason.trim()) {
      setError({
        title: 'Blocker Reason Required',
        status: 400,
        detail: 'Please specify why this work order is placed on hold or blocked.',
      });
      return;
    }

    if (status === 'COMPLETED' && !resolutionSummary.trim()) {
      setError({
        title: 'Resolution Summary Required',
        status: 400,
        detail: 'Please provide a technical resolution summary before completing the work order.',
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: UpdateWorkOrderProgressPayload = {
      status,
      blockedReason: status === 'BLOCKED' ? blockedReason.trim() : undefined,
      laborHours,
      partsCost,
      resolutionSummary: resolutionSummary.trim() || undefined,
      progressNote: progressNote.trim() || undefined,
    };

    try {
      let updated: MaintenanceWorkOrder;
      if (status === 'COMPLETED') {
        updated = await maintenanceApi.completeWorkOrder(workOrder.id, {
          resolutionSummary: resolutionSummary.trim(),
          laborHours,
          partsCost,
        });
      } else {
        updated = await maintenanceApi.updateWorkOrderProgress(workOrder.id, payload);
      }
      onSuccess(updated);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Update Failed',
          status: 500,
          detail: 'An error occurred while updating the work order.',
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
      aria-labelledby="update-wo-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="update-wo-title" className="text-base font-semibold text-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent-lime" />
              Update Work Order Progress
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {workOrder.workOrderNumber} — {workOrder.equipmentAssetTag}
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
              Work Order Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkOrderStatus)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="IN_PROGRESS">IN_PROGRESS (Active repair operations)</option>
              <option value="BLOCKED">BLOCKED (Waiting on parts, vendor, or lab access)</option>
              <option value="COMPLETED">COMPLETED (Repair finished, ready for inspection)</option>
            </select>
          </div>

          {status === 'BLOCKED' && (
            <div>
              <label htmlFor="blocker-reason" className="block text-xs font-medium text-foreground mb-1.5">
                Blocker / Delay Explanation *
              </label>
              <input
                id="blocker-reason"
                type="text"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="e.g. Waiting on replacement power supply module delivery from Agilent"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="labor-hours" className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent-lime" />
                Total Labor Hours
              </label>
              <input
                id="labor-hours"
                type="number"
                step="0.25"
                min="0"
                value={laborHours ?? ''}
                onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="parts-cost" className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-accent-lime" />
                Parts & Materials Cost ($)
              </label>
              <input
                id="parts-cost"
                type="number"
                step="0.01"
                min="0"
                value={partsCost ?? ''}
                onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {status === 'COMPLETED' ? (
            <div>
              <label htmlFor="res-summary" className="block text-xs font-medium text-foreground mb-1.5">
                Resolution Summary & Actions Taken *
              </label>
              <textarea
                id="res-summary"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Detail what was repaired, replaced components, and baseline calibration tests executed..."
                rows={3}
                required
                className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground mt-1 italic">
                Note: Marking completed notifies staff for Return-to-Service inspection. Equipment remains in maintenance until inspection passes.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="progress-note" className="block text-xs font-medium text-foreground mb-1.5">
                Progress Note / Diagnostic Finding
              </label>
              <textarea
                id="progress-note"
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Log any diagnostic observations or parts ordered during this shift..."
                rows={2}
                className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Progress Update
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
