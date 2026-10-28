import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { FaultSeverityBadge } from '@/components/maintenance/FaultSeverityBadge';
import { FaultStatusBadge } from '@/components/maintenance/FaultStatusBadge';
import { TriageFaultModal } from '@/components/maintenance/TriageFaultModal';
import { CreateWorkOrderModal } from '@/components/maintenance/CreateWorkOrderModal';
import { FaultReport, FaultStatus } from '@/types/maintenance';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  MapPin,
  RefreshCw,
  User,
  Wrench,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export const FaultDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [fault, setFault] = useState<FaultReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveText, setResolveText] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const isStaff = user?.roles.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT'
  );
  const canResolve = user?.roles.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT' || r === 'ROLE_TECHNICIAN'
  );

  const loadFault = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await maintenanceApi.getFaultById(id);
      setFault(data);
    } catch (err) {
      console.error('Failed to load fault detail:', err);
      setErrorMessage('The requested defect report could not be located in the ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFault();
  }, [loadFault]);

  const handleCloseReport = async () => {
    if (!id) return;
    try {
      await maintenanceApi.closeFault(id);
      toast.info('Defect report officially closed.');
      await loadFault();
    } catch (err) {
      console.error('Failed to close fault report:', err);
      toast.error('Failed to close defect report.');
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resolveText.trim()) return;
    setIsResolving(true);
    try {
      await maintenanceApi.resolveFault(id, { resolutionDetails: resolveText.trim() });
      toast.success('Defect marked as resolved.');
      setShowResolveForm(false);
      await loadFault();
    } catch (err) {
      console.error('Failed to resolve fault:', err);
      toast.error('Failed to mark fault as resolved.');
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Pending';
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const timelineSteps: { key: FaultStatus; label: string }[] = [
    { key: 'OPEN', label: 'Reported' },
    { key: 'TRIAGED', label: 'Triaged' },
    { key: 'IN_REPAIR', label: 'In Repair' },
    { key: 'RESOLVED', label: 'Resolved' },
    { key: 'CLOSED', label: 'Closed' },
  ];

  const getStepState = (stepKey: FaultStatus, currentStatus?: FaultStatus) => {
    if (!currentStatus) return 'upcoming';
    const statusOrder: FaultStatus[] = ['OPEN', 'TRIAGED', 'IN_REPAIR', 'RESOLVED', 'CLOSED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentStatus === 'REJECTED') {
      return stepKey === 'OPEN' ? 'completed' : 'upcoming';
    }
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Fault Reports', href: '/app/faults' },
        { label: fault ? fault.faultNumber : 'Fault Detail' },
      ]}
    >
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/app/faults"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Fault Reports Ledger
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Retrieving fault report dossier...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && errorMessage && (
          <div className="p-8 rounded-xl border border-rose-500/30 bg-rose-500/10 text-center max-w-xl mx-auto my-12">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">Defect Record Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{errorMessage}</p>
            <Button variant="secondary" onClick={() => navigate('/app/faults')}>
              Return to Ledger
            </Button>
          </div>
        )}

        {/* Loaded Profile */}
        {!isLoading && fault && (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border">
                      {fault.faultNumber}
                    </span>
                    <FaultSeverityBadge severity={fault.severity} />
                    <FaultStatusBadge status={fault.status} />
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {fault.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                    <Link
                      to={`/app/equipment/${fault.equipmentId}`}
                      className="font-medium text-foreground hover:text-accent-lime transition-colors flex items-center gap-1"
                    >
                      <span>{fault.equipmentName}</span>
                      <span className="font-mono text-xs">({fault.equipmentAssetTag})</span>
                    </Link>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-accent-lime" />
                      {fault.laboratoryName}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {isStaff && fault.status !== 'CLOSED' && fault.status !== 'REJECTED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsTriageModalOpen(true)}
                    >
                      <FileCheck className="w-4 h-4 mr-1.5 text-accent-lime" />
                      Triage Report
                    </Button>
                  )}

                  {isStaff && fault.status !== 'CLOSED' && fault.status !== 'REJECTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsWorkOrderModalOpen(true)}
                      className="gap-1.5"
                    >
                      <Wrench className="w-4 h-4 text-ink-950" />
                      <span>Dispatch Work Order</span>
                    </Button>
                  )}

                  {canResolve && fault.status === 'IN_REPAIR' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResolveForm(!showResolveForm)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" />
                      Resolve Defect
                    </Button>
                  )}

                  {isStaff && fault.status === 'RESOLVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseReport}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                      Close Report
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div className="pt-6 border-t border-border/80">
                <div className="flex items-center justify-between max-w-3xl">
                  {timelineSteps.map((step, idx) => {
                    const state = getStepState(step.key, fault.status);
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              state === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                : state === 'current'
                                ? 'bg-accent-lime text-ink-950 ring-2 ring-accent-lime/40'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {state === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-foreground mt-1.5">
                            {step.label}
                          </span>
                        </div>
                        {idx < timelineSteps.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 ${
                              state === 'completed' ? 'bg-emerald-500/40' : 'bg-border'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resolve Form Drawer */}
            {showResolveForm && (
              <div className="p-6 rounded-xl border border-teal-500/30 bg-teal-500/5 shadow-subtle space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Record Fault Resolution
                </h3>
                <form onSubmit={handleResolveSubmit} className="space-y-3">
                  <textarea
                    value={resolveText}
                    onChange={(e) => setResolveText(e.target.value)}
                    placeholder="Document the exact technical actions, parts replaced, and benchmark tests confirming resolution..."
                    rows={3}
                    required
                    className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <div className="flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResolveForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={isResolving}>
                      Confirm Resolution
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Technical Description, Triage Notes, Resolution */}
              <div className="lg:col-span-2 space-y-6">
                {/* Defect Description */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-3">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent-lime" />
                    Observed Defect Description
                  </h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-4 rounded-lg border border-border/60">
                    {fault.description}
                  </p>
                </div>

                {/* Triage Assessment */}
                {fault.triageNotes && (
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-3">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-accent-lime" />
                      Laboratory Staff Triage Assessment
                    </h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-4 rounded-lg border border-border/60">
                      {fault.triageNotes}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Assessed by: <strong className="text-foreground">{fault.triagedByName}</strong></span>
                      <span className="font-mono">{formatDate(fault.triagedAt)}</span>
                    </div>
                  </div>
                )}

                {/* Resolution Details */}
                {fault.resolutionDetails && (
                  <div className="p-6 rounded-xl border border-teal-500/30 bg-card shadow-subtle space-y-3">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      Technical Resolution Details
                    </h2>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-teal-500/5 p-4 rounded-lg border border-teal-500/20">
                      {fault.resolutionDetails}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Resolved by: <strong className="text-foreground">{fault.resolvedByName}</strong></span>
                      <span className="font-mono">{formatDate(fault.resolvedAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 3: Institutional Metadata */}
              <div className="space-y-6">
                {/* Equipment & Bay Assignment */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-3 text-xs">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-accent-lime" />
                    Target Instrument & Bay
                  </h3>
                  <div>
                    <span className="text-muted-foreground block">Instrument:</span>
                    <Link
                      to={`/app/equipment/${fault.equipmentId}`}
                      className="font-semibold text-foreground hover:text-accent-lime transition-colors block mt-0.5 text-sm"
                    >
                      {fault.equipmentName}
                    </Link>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Asset Tag:</span>
                    <span className="font-mono font-medium text-foreground">{fault.equipmentAssetTag}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Facility:</span>
                    <span className="text-foreground">{fault.laboratoryName}</span>
                  </div>
                </div>

                {/* Reporter Metadata */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-3 text-xs">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-accent-lime" />
                    Reporting Researcher
                  </h3>
                  <div>
                    <span className="text-muted-foreground block">Researcher:</span>
                    <span className="font-medium text-foreground">{fault.reportedByName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Email:</span>
                    <span className="font-mono text-foreground">{fault.reportedByEmail}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Reported At:</span>
                    <span className="font-mono text-foreground">{formatDate(fault.reportedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isTriageModalOpen && fault && (
        <TriageFaultModal
          fault={fault}
          isOpen={isTriageModalOpen}
          onClose={() => setIsTriageModalOpen(false)}
          onSuccess={() => {
            setIsTriageModalOpen(false);
            loadFault();
          }}
        />
      )}

      {isWorkOrderModalOpen && fault && (
        <CreateWorkOrderModal
          equipmentId={fault.equipmentId}
          equipmentName={fault.equipmentName}
          equipmentAssetTag={fault.equipmentAssetTag}
          faultReportId={fault.id}
          faultReportNumber={fault.faultNumber}
          initialTitle={`Repair for ${fault.faultNumber}: ${fault.title}`}
          initialDescription={`Diagnose and resolve reported fault: ${fault.description}`}
          isOpen={isWorkOrderModalOpen}
          onClose={() => setIsWorkOrderModalOpen(false)}
          onSuccess={(wo) => {
            toast.success(`Work order ${wo.workOrderNumber} created.`);
            setIsWorkOrderModalOpen(false);
            navigate(`/app/work-orders/${wo.id}`);
          }}
        />
      )}
    </AppLayout>
  );
};
