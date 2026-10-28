import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { WorkOrderStatusBadge } from '@/components/maintenance/WorkOrderStatusBadge';
import { WorkOrderPriorityBadge } from '@/components/maintenance/WorkOrderPriorityBadge';
import { UpdateWorkOrderModal } from '@/components/maintenance/UpdateWorkOrderModal';
import { ReturnToServiceModal } from '@/components/maintenance/ReturnToServiceModal';
import {
  MaintenanceWorkOrder,
  MaintenanceWorkOrderSummary,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@/types/maintenance';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { PageResponse } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Wrench,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';

export const WorkOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_TASKS'>('ALL');
  const [workOrdersData, setWorkOrdersData] = useState<PageResponse<MaintenanceWorkOrderSummary>>({
    content: [],
    pageNumber: 0,
    pageSize: 15,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [updatingWorkOrder, setUpdatingWorkOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [inspectingWorkOrder, setInspectingWorkOrder] = useState<MaintenanceWorkOrder | null>(null);

  const isStaff = user?.roles.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT'
  );
  const isTechnician = user?.roles.some(
    (r) => r === 'ROLE_TECHNICIAN' || r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT'
  );

  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let data: PageResponse<MaintenanceWorkOrderSummary>;
      if (activeTab === 'MY_TASKS') {
        data = await maintenanceApi.getTechnicianTasks(currentPage, 15);
      } else {
        data = await maintenanceApi.findWorkOrders({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
          search: searchTerm.trim() || undefined,
          page: currentPage,
          size: 15,
        });
      }
      setWorkOrdersData(data);
    } catch (err) {
      console.error('Failed to load work orders:', err);
      setErrorMessage('Failed to retrieve work orders from the maintenance ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, priorityFilter, searchTerm, currentPage]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleOpenUpdate = async (summary: MaintenanceWorkOrderSummary) => {
    try {
      const full = await maintenanceApi.getWorkOrderById(summary.id);
      setUpdatingWorkOrder(full);
    } catch (err) {
      console.error('Failed to load work order detail for update:', err);
    }
  };

  const handleOpenInspect = async (summary: MaintenanceWorkOrderSummary) => {
    try {
      const full = await maintenanceApi.getWorkOrderById(summary.id);
      setInspectingWorkOrder(full);
    } catch (err) {
      console.error('Failed to load work order detail for inspection:', err);
    }
  };

  const handleStartWork = async (summary: MaintenanceWorkOrderSummary) => {
    try {
      await maintenanceApi.startWorkOrder(summary.id);
      await loadWorkOrders();
    } catch (err) {
      console.error('Failed to start work order:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Work Orders', href: '/app/work-orders' }]}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Maintenance Work Orders
              </h1>
              {workOrdersData.totalElements > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-mono font-semibold text-foreground border border-border">
                  {workOrdersData.totalElements} Active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Dispatch, track diagnostic progress, record labor/parts, and manage return-to-service validation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadWorkOrders}
              disabled={isLoading}
              title="Refresh ledger"
              aria-label="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {isStaff && (
              <Link to="/app/equipment">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-ink-950" />
                  <span>Issue Work Order</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-2">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-accent-lime text-ink-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            All Work Orders
          </button>
          {isTechnician && (
            <button
              onClick={() => {
                setActiveTab('MY_TASKS');
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'MY_TASKS'
                  ? 'bg-accent-lime text-ink-950 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>My Assigned Tasks</span>
            </button>
          )}
        </div>

        {/* Filter Bar (for ALL tab) */}
        {activeTab === 'ALL' && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Search by WO number, instrument, technician, or title..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as WorkOrderStatus | 'ALL');
                  setCurrentPage(0);
                }}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="CREATED">CREATED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as WorkOrderPriority | 'ALL');
                  setCurrentPage(0);
                }}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Scanning work order records...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto my-8">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Error Loading Work Orders</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{errorMessage}</p>
            <Button variant="secondary" size="sm" onClick={loadWorkOrders}>
              Retry Query
            </Button>
          </div>
        ) : workOrdersData.content.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-border/80 bg-card text-center space-y-3 max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-accent-lime/10 text-accent-lime mx-auto flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Maintenance Work Orders</h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'MY_TASKS'
                ? 'You currently have no maintenance work orders assigned to you.'
                : 'No work orders found matching the active filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
              {workOrdersData.content.map((wo) => (
                <div
                  key={wo.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Left: Summary */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {wo.workOrderNumber}
                      </span>
                      <WorkOrderPriorityBadge priority={wo.priority} />
                      <WorkOrderStatusBadge status={wo.status} />
                      {wo.passedInspection && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Certified in Service
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/app/work-orders/${wo.id}`}
                      className="font-semibold text-foreground hover:text-accent-lime transition-colors text-base block"
                    >
                      {wo.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <Link
                        to={`/app/equipment/${wo.equipmentId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {wo.equipmentName} ({wo.equipmentAssetTag})
                      </Link>
                      <span>•</span>
                      <span>{wo.laboratoryName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Technician: <strong className="text-foreground">{wo.assignedTechnicianName || 'Unassigned'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        Target: {formatDate(wo.plannedCompletionDate)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                    <Link to={`/app/work-orders/${wo.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Dossier
                      </Button>
                    </Link>

                    {wo.status === 'ASSIGNED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartWork(wo)}
                        className="text-xs gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-accent-lime" />
                        <span>Start Work</span>
                      </Button>
                    )}

                    {(wo.status === 'IN_PROGRESS' || wo.status === 'BLOCKED') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenUpdate(wo)}
                        className="text-xs gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5 text-accent-lime" />
                        <span>Log Progress</span>
                      </Button>
                    )}

                    {isStaff && wo.status === 'COMPLETED' && !wo.passedInspection && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenInspect(wo)}
                        className="text-xs gap-1.5 text-ink-950 font-semibold"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-ink-950" />
                        <span>Inspect & Certify</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {workOrdersData.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
                <span>
                  Showing {workOrdersData.content.length} of {workOrdersData.totalElements} records (Page{' '}
                  {workOrdersData.pageNumber + 1} of {workOrdersData.totalPages})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={workOrdersData.first}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(workOrdersData.totalPages - 1, p + 1))}
                    disabled={workOrdersData.last}
                    className="h-8 px-2.5"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {updatingWorkOrder && (
        <UpdateWorkOrderModal
          workOrder={updatingWorkOrder}
          isOpen={!!updatingWorkOrder}
          onClose={() => setUpdatingWorkOrder(null)}
          onSuccess={() => {
            setUpdatingWorkOrder(null);
            loadWorkOrders();
          }}
        />
      )}

      {inspectingWorkOrder && (
        <ReturnToServiceModal
          workOrder={inspectingWorkOrder}
          isOpen={!!inspectingWorkOrder}
          onClose={() => setInspectingWorkOrder(null)}
          onSuccess={() => {
            toast.success('Equipment returned to service successfully.');
            setInspectingWorkOrder(null);
            loadWorkOrders();
          }}
        />
      )}
    </AppLayout>
  );
};
