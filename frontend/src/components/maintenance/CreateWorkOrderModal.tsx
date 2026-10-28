import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { maintenanceApi } from '@/lib/maintenanceApi';
import {
  CreateWorkOrderPayload,
  MaintenanceWorkOrder,
  WorkOrderPriority,
} from '@/types/maintenance';
import { AlertCircle, Wrench, X } from 'lucide-react';

interface CreateWorkOrderModalProps {
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  faultReportId?: string;
  faultReportNumber?: string;
  initialTitle?: string;
  initialDescription?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workOrder: MaintenanceWorkOrder) => void;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  equipmentId,
  equipmentName,
  equipmentAssetTag,
  faultReportId,
  faultReportNumber,
  initialTitle = '',
  initialDescription = '',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [plannedStartDate, setPlannedStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [plannedCompletionDate, setPlannedCompletionDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const payload: CreateWorkOrderPayload = {
      equipmentId,
      faultReportId,
      title: title.trim(),
      description: description.trim(),
      priority,
      plannedStartDate,
      plannedCompletionDate,
    };

    try {
      const created = await maintenanceApi.createWorkOrder(payload);
      onSuccess(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Work Order Creation Failed',
          status: 500,
          detail: 'An error occurred while dispatching the work order.',
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
      aria-labelledby="create-wo-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="create-wo-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wrench className="w-5 h-5 text-accent-lime" />
              Commission Maintenance Work Order
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-foreground">{equipmentAssetTag}</span> — {equipmentName}
              {faultReportNumber && (
                <span className="ml-2 font-mono text-accent-lime">({faultReportNumber})</span>
              )}
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
            <label htmlFor="wo-title" className="block text-xs font-medium text-foreground mb-1.5">
              Work Order Scope / Title *
            </label>
            <input
              id="wo-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Replace vacuum manifold assembly and calibrate pressure transducer"
              required
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div>
              <label htmlFor="wo-start-date" className="block text-xs font-medium text-foreground mb-1.5">
                Planned Start
              </label>
              <input
                id="wo-start-date"
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="wo-end-date" className="block text-xs font-medium text-foreground mb-1.5">
                Target Target Date
              </label>
              <input
                id="wo-end-date"
                type="date"
                value={plannedCompletionDate}
                onChange={(e) => setPlannedCompletionDate(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wo-desc" className="block text-xs font-medium text-foreground mb-1.5">
              Technical Description & Diagnostic Instructions *
            </label>
            <textarea
              id="wo-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline steps required, replacement parts to install, vendor service contacts, and safety protocols..."
              rows={4}
              required
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Dispatch Work Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
