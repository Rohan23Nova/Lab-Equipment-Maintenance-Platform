import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { FaultReportSummary, MaintenanceWorkOrderSummary } from '@/types/maintenance';
import { FaultSeverityBadge } from '@/components/maintenance/FaultSeverityBadge';
import { FaultStatusBadge } from '@/components/maintenance/FaultStatusBadge';
import { WorkOrderStatusBadge } from '@/components/maintenance/WorkOrderStatusBadge';
import { WorkOrderPriorityBadge } from '@/components/maintenance/WorkOrderPriorityBadge';
import { Button } from '@/components/ui/Button';
import {
  Wrench,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  User,
  ShieldCheck,
} from 'lucide-react';

interface EquipmentMaintenanceHistoryProps {
  equipmentId: string;
}

export const EquipmentMaintenanceHistory: React.FC<EquipmentMaintenanceHistoryProps> = ({
  equipmentId,
}) => {
  const [faults, setFaults] = useState<FaultReportSummary[]>([]);
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [faultsPage, woPage] = await Promise.all([
        maintenanceApi.findFaults({ equipmentId, size: 20 }),
        maintenanceApi.findWorkOrders({ equipmentId, size: 20 }),
      ]);
      setFaults(faultsPage.content);
      setWorkOrders(woPage.content);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
      setErrorMessage('Unable to load maintenance records for this instrument.');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 bg-card rounded-xl border border-border/80">
        <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
        <p className="text-sm font-medium">Retrieving fault reports and maintenance records...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-foreground font-semibold">{errorMessage}</p>
        <Button variant="outline" size="sm" onClick={loadData} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  const activeFaults = faults.filter((f) => f.status !== 'CLOSED' && f.status !== 'REJECTED');
  const pastFaults = faults.filter((f) => f.status === 'CLOSED' || f.status === 'REJECTED');

  return (
    <div className="space-y-8">
      {/* Top summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Active Defects</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{activeFaults.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Requiring triage or repair</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Total Work Orders</span>
            <ClipboardList className="w-4 h-4 text-accent-lime" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{workOrders.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Lifecycle maintenance jobs</p>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Historical Incidents</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{pastFaults.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Resolved & certified closed</p>
        </div>
      </div>

      {/* Section 1: Maintenance Work Orders */}
      <div className="rounded-xl border border-border/80 bg-card shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-accent-lime" />
            <h2 className="text-base font-semibold text-foreground">Maintenance Work Orders</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {workOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No work orders recorded</p>
            <p className="text-xs text-muted-foreground mt-1">
              This instrument has no ongoing or historical maintenance service orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">WO Number</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Title</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Priority</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Technician</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {wo.workOrderNumber}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs font-medium text-foreground truncate">
                      {wo.title}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <WorkOrderPriorityBadge priority={wo.priority} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <WorkOrderStatusBadge status={wo.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {wo.assignedTechnicianName ? (
                        <span className="flex items-center gap-1.5 text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {wo.assignedTechnicianName}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(wo.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link to={`/app/work-orders/${wo.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1">
                          <span>Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Fault Reports */}
      <div className="rounded-xl border border-border/80 bg-card shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-foreground">Defect & Fault History</h2>
          </div>
        </div>

        {faults.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Clean operational record</p>
            <p className="text-xs text-muted-foreground mt-1">
              Zero faults or defects have been reported for this instrument.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Report #</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Title</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Severity</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reported By</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Reported At</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {faults.map((fault) => (
                  <tr key={fault.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {fault.faultNumber}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs font-medium text-foreground truncate">
                      {fault.title}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <FaultSeverityBadge severity={fault.severity} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <FaultStatusBadge status={fault.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {fault.reportedByName}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(fault.reportedAt || fault.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <Link to={`/app/faults/${fault.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1">
                          <span>View</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
