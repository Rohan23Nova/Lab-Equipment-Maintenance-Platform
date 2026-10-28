import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { MaintenanceWorkOrder, NoteType } from '@/types/maintenance';
import { WorkOrderStatusBadge } from '@/components/maintenance/WorkOrderStatusBadge';
import { WorkOrderPriorityBadge } from '@/components/maintenance/WorkOrderPriorityBadge';
import { UpdateWorkOrderModal } from '@/components/maintenance/UpdateWorkOrderModal';
import { ReturnToServiceModal } from '@/components/maintenance/ReturnToServiceModal';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Play,
  RefreshCw,
  ShieldCheck,
  User,
  Plus,
  Send,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [workOrder, setWorkOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isReturnToServiceModalOpen, setIsReturnToServiceModalOpen] = useState(false);
  const [isStartingWork, setIsStartingWork] = useState(false);

  // New Note state
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('PROGRESS_UPDATE');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Permission checks
  const isStaff = user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT') ?? false;
  const isTechnician = user?.roles.includes('ROLE_TECHNICIAN') ?? false;
  const isAssignedTech = workOrder?.assignedTechnicianId === user?.id;
  const canModifyWork = isStaff || isAssignedTech || (isTechnician && !workOrder?.assignedTechnicianId);

  const loadWorkOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await maintenanceApi.getWorkOrderById(id);
      setWorkOrder(data);
    } catch (err) {
      console.error('Failed to load work order:', err);
      setErrorMessage('The requested maintenance work order could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkOrder();
  }, [loadWorkOrder]);

  const handleStartWork = async () => {
    if (!id) return;
    setIsStartingWork(true);
    try {
      await maintenanceApi.startWorkOrder(id);
      toast.success('Work order commenced. Status updated to IN_PROGRESS.');
      await loadWorkOrder();
    } catch (err: any) {
      toast.error(err.message || 'Failed to start work on this order');
    } finally {
      setIsStartingWork(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteContent.trim()) return;

    setIsSubmittingNote(true);
    setNoteError(null);
    try {
      await maintenanceApi.addWorkOrderNote(id, {
        noteType,
        notes: noteContent.trim(),
      });
      toast.success('Technician progress note recorded.');
      setNoteContent('');
      await loadWorkOrder();
    } catch (err: any) {
      setNoteError(err.message || 'Failed to append note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Work Orders', href: '/app/work-orders' },
        { label: workOrder ? workOrder.workOrderNumber : 'Order Detail' },
      ]}
    >
      <div>
        {/* Navigation / Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/app/work-orders"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Work Orders
          </Link>
          <Button variant="ghost" size="sm" onClick={loadWorkOrder} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Retrieving work order records and audit logs...</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && errorMessage && (
          <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/10 text-center max-w-xl mx-auto my-12">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">Work Order Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{errorMessage}</p>
            <Button variant="secondary" onClick={() => navigate('/app/work-orders')}>
              Return to Work Orders Ledger
            </Button>
          </div>
        )}

        {/* Work Order Detail View */}
        {!isLoading && workOrder && (
          <div className="space-y-6">
            {/* Header Hero Banner */}
            <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                      {workOrder.workOrderNumber}
                    </span>
                    <WorkOrderStatusBadge status={workOrder.status} />
                    <WorkOrderPriorityBadge priority={workOrder.priority} />
                    {workOrder.faultReportId && (
                      <Badge variant="outline" className="text-xs">
                        Fault Linked
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {workOrder.title}
                  </h1>

                  <p className="text-sm text-muted-foreground mt-2">
                    Commissioned by <span className="font-medium text-foreground">{workOrder.createdByName}</span> on{' '}
                    <span>{formatDate(workOrder.createdAt)}</span>
                  </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Start Work Action */}
                  {(workOrder.status === 'CREATED' || workOrder.status === 'ASSIGNED') && canModifyWork && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleStartWork}
                      disabled={isStartingWork}
                      className="gap-1.5 text-ink-950 font-semibold"
                    >
                      <Play className="w-4 h-4" />
                      <span>{isStartingWork ? 'Starting...' : 'Start Work'}</span>
                    </Button>
                  )}

                  {/* Update Progress Action */}
                  {(workOrder.status === 'IN_PROGRESS' || workOrder.status === 'BLOCKED') && canModifyWork && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsUpdateModalOpen(true)}
                      className="gap-1.5"
                    >
                      <Wrench className="w-4 h-4 text-accent-lime" />
                      <span>Update Progress</span>
                    </Button>
                  )}

                  {/* Return to Service Inspection Action */}
                  {workOrder.status === 'COMPLETED' && isStaff && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsReturnToServiceModalOpen(true)}
                      className="gap-1.5 text-ink-950 font-semibold"
                    >
                      <ShieldCheck className="w-4 h-4 text-ink-950" />
                      <span>Inspect & Return to Service</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Grid: Details & Notes Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 cols): Description, Findings, Linked Objects */}
              <div className="lg:col-span-2 space-y-6">
                {/* Scope & Description Card */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent-lime" />
                    Work Scope & Technical Description
                  </h2>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {workOrder.description}
                  </div>

                  {workOrder.resolutionSummary && (
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Resolution Summary
                      </h3>
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm leading-relaxed whitespace-pre-wrap">
                        {workOrder.resolutionSummary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Return to Service Inspection Report (If inspected) */}
                {workOrder.inspectedAt && (
                  <div
                    className={`p-6 rounded-xl border shadow-subtle ${
                      workOrder.passedInspection
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : 'border-rose-500/40 bg-rose-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {workOrder.passedInspection ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <h2 className="text-base font-semibold text-foreground">
                          Return-to-Service Inspection Certification
                        </h2>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          workOrder.passedInspection
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {workOrder.passedInspection ? 'INSPECTION PASSED' : 'INSPECTION FAILED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3 mb-4">
                      <div>
                        <span className="text-muted-foreground block">Inspecting Authority</span>
                        <span className="font-semibold text-foreground text-sm">
                          {workOrder.inspectedByName || 'Lab Staff'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Inspection Timestamp</span>
                        <span className="font-semibold text-foreground text-sm">
                          {formatDate(workOrder.inspectedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background border border-border/60 text-xs">
                      <span className="font-semibold text-muted-foreground block mb-1">
                        Inspector Verification Notes:
                      </span>
                      <p className="text-foreground leading-relaxed">
                        {workOrder.inspectionNotes || 'No notes recorded.'}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 italic">
                      {workOrder.passedInspection
                        ? 'Instrument has met all quality and calibration benchmarks and was restored to operational service.'
                        : 'Instrument failed verification benchmarks and has been retained in UNDER_MAINTENANCE status.'}
                    </p>
                  </div>
                )}

                {/* Diagnostic & Activity Notes Stream */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-accent-lime" />
                      Technician Diagnostic Log & Progress Stream
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground">
                      {workOrder.notes.length} record{workOrder.notes.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Add Note Form */}
                  {canModifyWork && workOrder.status !== 'COMPLETED' && (
                    <form onSubmit={handleAddNote} className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-accent-lime" />
                          Log Diagnostic Finding / Progress Note
                        </label>
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value as NoteType)}
                          className="px-2 py-1 text-xs rounded border border-input bg-background font-medium"
                        >
                          <option value="PROGRESS_UPDATE">Progress Update</option>
                          <option value="DIAGNOSTIC_FINDING">Diagnostic Finding</option>
                          <option value="PARTS_ORDERED">Parts Ordered</option>
                          <option value="BLOCKER_FLAG">Blocker Flag</option>
                          <option value="INSPECTION_NOTE">Inspection Note</option>
                        </select>
                      </div>

                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Document observations, component replacements, calibration measurements, or test results..."
                        rows={3}
                        required
                        className="w-full px-3 py-2 text-xs rounded-md border border-input bg-background text-foreground focus:ring-1 focus:ring-accent-lime focus:outline-none"
                      />

                      {noteError && (
                        <p className="text-xs text-destructive font-medium">{noteError}</p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          variant="secondary"
                          size="sm"
                          disabled={isSubmittingNote || !noteContent.trim()}
                          className="gap-1.5 text-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingNote ? 'Saving...' : 'Append Note'}</span>
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Notes Timeline List */}
                  {workOrder.notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                      No technical notes or diagnostic logs recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {workOrder.notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-lg border border-border/70 bg-background/50 hover:bg-background transition-colors text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{note.authorName}</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 uppercase font-mono">
                                {note.noteType.replace('_', ' ')}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground text-[11px]">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap pt-1">
                            {note.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Instrument & Metadata Cards */}
              <div className="space-y-6">
                {/* Target Equipment Profile Card */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-accent-lime" />
                      Assigned Instrument
                    </h2>
                    <Link
                      to={`/app/equipment/${workOrder.equipmentId}`}
                      className="text-xs text-accent-lime hover:underline flex items-center gap-1"
                    >
                      Profile
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {workOrder.equipmentAssetTag}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{workOrder.equipmentName}</p>
                  </div>
                </div>

                {/* Linked Fault Incident Card */}
                {workOrder.faultReportId && (
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Associated Defect
                      </h2>
                      <Link
                        to={`/app/faults/${workOrder.faultReportId}`}
                        className="text-xs text-accent-lime hover:underline flex items-center gap-1"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                      <span className="text-xs text-muted-foreground block">Fault Report #</span>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {workOrder.faultReportNumber || workOrder.faultReportId.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Service Labor & Financials Card */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent-lime" />
                    Resource & Cost Ledger
                  </h2>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                      <span className="text-muted-foreground block mb-0.5">Labor Hours</span>
                      <div className="flex items-center gap-1 font-mono text-base font-bold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-accent-lime" />
                        <span>{workOrder.laborHours ?? 0} hrs</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                      <span className="text-muted-foreground block mb-0.5">Parts Cost</span>
                      <div className="flex items-center gap-1 font-mono text-base font-bold text-foreground">
                        <span>{formatCurrency(workOrder.partsCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technician Assignment & Schedule Card */}
                <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4 text-xs">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-accent-lime" />
                    Personnel & Timeline
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Assigned Technician:</span>
                      <span className="font-semibold text-foreground">
                        {workOrder.assignedTechnicianName || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Planned Start:</span>
                      <span className="font-mono text-foreground">
                        {formatDate(workOrder.plannedStartDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Planned Completion:</span>
                      <span className="font-mono text-foreground">
                        {formatDate(workOrder.plannedCompletionDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Actual Start:</span>
                      <span className="font-mono text-foreground">
                        {formatDate(workOrder.actualStartTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground">Actual Completion:</span>
                      <span className="font-mono text-foreground">
                        {formatDate(workOrder.actualCompletionTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Work Order Modal */}
        {workOrder && (
          <UpdateWorkOrderModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            onSuccess={() => {
              toast.success('Work order status and work logs updated.');
              loadWorkOrder();
            }}
            workOrder={workOrder}
          />
        )}

        {/* Return To Service Modal */}
        {workOrder && (
          <ReturnToServiceModal
            isOpen={isReturnToServiceModalOpen}
            onClose={() => setIsReturnToServiceModalOpen(false)}
            onSuccess={() => {
              toast.success('Return-to-service protocol verified. Equipment restored.');
              loadWorkOrder();
            }}
            workOrder={workOrder}
          />
        )}
      </div>
    </AppLayout>
  );
};
