import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { analyticsApi } from '@/lib/analyticsApi';
import { inventoryApi } from '@/lib/inventoryApi';
import {
  EquipmentRepeatedFaultsDto,
  InventoryDistributionReport,
  MaintenanceTrendsReport,
  OverdueWorkOrderReport,
  ReportFilterCriteria,
  UtilizationReport,
} from '@/types/analytics';
import { Laboratory } from '@/types/inventory';
import {
  FileText,
  Download,
  Filter,
  RefreshCw,
  Cpu,
  TrendingUp,
  Wrench,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'utilization' | 'maintenance' | 'overdue' | 'failures'>('inventory');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inventoryReport, setInventoryReport] = useState<InventoryDistributionReport | null>(null);
  const [utilizationReport, setUtilizationReport] = useState<UtilizationReport | null>(null);
  const [maintenanceReport, setMaintenanceReport] = useState<MaintenanceTrendsReport | null>(null);
  const [overdueReport, setOverdueReport] = useState<OverdueWorkOrderReport[]>([]);
  const [failuresReport, setFailuresReport] = useState<EquipmentRepeatedFaultsDto[]>([]);

  useEffect(() => {
    inventoryApi.getLaboratories().then(setLaboratories).catch(() => {});
  }, []);

  const fetchActiveReport = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    const from = new Date(now.getTime() - timeRangeDays * 24 * 3600 * 1000);

    const filter: ReportFilterCriteria = {
      fromTimestamp: from.toISOString(),
      toTimestamp: now.toISOString(),
      laboratoryId: selectedLabId || undefined,
    };

    try {
      switch (activeTab) {
        case 'inventory':
          const inv = await analyticsApi.getInventoryReport(filter);
          setInventoryReport(inv);
          break;
        case 'utilization':
          const utl = await analyticsApi.getUtilizationReport(filter);
          setUtilizationReport(utl);
          break;
        case 'maintenance':
          const mtr = await analyticsApi.getMaintenanceReport(filter);
          setMaintenanceReport(mtr);
          break;
        case 'overdue':
          const ovd = await analyticsApi.getOverdueMaintenanceReport();
          setOverdueReport(ovd);
          break;
        case 'failures':
          const fail = await analyticsApi.getRepeatedFailuresReport(filter);
          setFailuresReport(fail);
          break;
      }
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, timeRangeDays, selectedLabId]);

  useEffect(() => {
    fetchActiveReport();
  }, [fetchActiveReport]);

  const handleDownloadCsv = () => {
    const now = new Date();
    const from = new Date(now.getTime() - timeRangeDays * 24 * 3600 * 1000);
    const filter: ReportFilterCriteria = {
      fromTimestamp: from.toISOString(),
      toTimestamp: now.toISOString(),
      laboratoryId: selectedLabId || undefined,
    };

    let reportKey = activeTab === 'overdue' ? 'overdue-maintenance' : activeTab === 'failures' ? 'repeated-failures' : activeTab;
    const url = analyticsApi.getExportUrl(reportKey, filter);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-accent-lime" />
              Institutional Reports & Auditing
            </h1>
            <p className="text-sm text-muted-foreground">
              Verifiable CSV-exportable reports for inventory distribution, instrument utilization, and lifecycle maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadCsv}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV (Safe)</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchActiveReport}
              title="Refresh report"
              className="px-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-lime' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2 text-xs font-semibold">
          {[
            { id: 'inventory', label: '1. Inventory & Valuation', icon: Cpu },
            { id: 'utilization', label: '2. Equipment Utilization', icon: TrendingUp },
            { id: 'maintenance', label: '3. Maintenance & MTTR', icon: Wrench },
            { id: 'overdue', label: '4. Overdue Work Orders', icon: AlertTriangle },
            { id: 'failures', label: '5. Recurring Failures', icon: AlertOctagon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground border border-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-lime' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/40 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">Window:</span>
            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
                { label: '365 Days', days: 365 },
              ].map((t) => (
                <button
                  key={t.days}
                  onClick={() => setTimeRangeDays(t.days)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    timeRangeDays === t.days
                      ? 'bg-muted text-foreground font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {laboratories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">Facility:</span>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="rounded border border-border bg-background py-1 px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent-lime"
              >
                <option value="">All Facilities</option>
                {laboratories.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {isLoading ? (
          <div className="py-24 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p>Compiling report data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Inventory Report */}
            {activeTab === 'inventory' && inventoryReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Active Assets</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {inventoryReport.totalActive}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Archived Assets</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {inventoryReport.totalArchived}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Capital Valuation</span>
                    <p className="text-2xl font-bold font-mono text-accent-lime mt-1">
                      ${inventoryReport.totalPurchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* By Category */}
                  <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Distribution by Category</h3>
                    <div className="divide-y divide-border/60 text-xs">
                      {Object.entries(inventoryReport.byCategory).map(([cat, count]) => (
                        <div key={cat} className="py-2 flex items-center justify-between">
                          <span className="text-muted-foreground">{cat}</span>
                          <span className="font-mono font-bold text-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Status */}
                  <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Distribution by Status</h3>
                    <div className="divide-y divide-border/60 text-xs">
                      {Object.entries(inventoryReport.byStatus).map(([st, count]) => (
                        <div key={st} className="py-2 flex items-center justify-between">
                          <span className="text-muted-foreground">{st}</span>
                          <span className="font-mono font-bold text-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Utilization Report */}
            {activeTab === 'utilization' && utilizationReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Overall Utilization</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {utilizationReport.overallUtilizationPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Total Operating Capacity</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {utilizationReport.totalCapacityHours.toFixed(0)} hrs
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Total Confirmed Bookings</span>
                    <p className="text-2xl font-bold font-mono text-accent-lime mt-1">
                      {utilizationReport.totalBookedHours.toFixed(1)} hrs
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Asset Tag</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3 text-right">Capacity (hrs)</th>
                        <th className="py-2.5 px-3 text-right">Booked (hrs)</th>
                        <th className="py-2.5 px-3 text-right">Utilization (%)</th>
                        <th className="py-2.5 px-3 text-center">Sessions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {utilizationReport.details.map((d) => (
                        <tr key={d.equipmentId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{d.assetTag}</td>
                          <td className="py-2.5 px-3 font-medium text-foreground">{d.equipmentName}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{d.laboratoryName}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{d.capacityHours.toFixed(0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            {d.bookedHours.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-accent-lime font-bold">
                            {d.utilizationPercentage.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{d.completedReservationsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Maintenance Report */}
            {activeTab === 'maintenance' && maintenanceReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Total Faults</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      {maintenanceReport.totalFaults}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Critical Incidents</span>
                    <p className="text-2xl font-bold font-mono text-rose-500 mt-1">
                      {maintenanceReport.criticalFaults}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Mean Turnaround (MTTR)</span>
                    <p className="text-2xl font-bold font-mono text-accent-lime mt-1">
                      {maintenanceReport.meanTimeToRepairHours != null ? `${maintenanceReport.meanTimeToRepairHours.toFixed(1)}h` : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Parts & Labor</span>
                    <p className="text-2xl font-bold font-mono text-foreground mt-1">
                      ${maintenanceReport.totalPartsCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Overdue Work Orders */}
            {activeTab === 'overdue' && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {overdueReport.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    <p className="font-semibold text-foreground text-sm">No overdue work orders</p>
                    <p className="mt-1">All maintenance tasks are currently progressing within planned milestones.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3">Assigned To</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3 text-right">Overdue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {overdueReport.map((row) => (
                        <tr key={row.workOrderId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {row.workOrderNumber}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">{row.title}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.equipmentName}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.laboratoryName}</td>
                          <td className="py-2.5 px-3">{row.assignedTechnicianName}</td>
                          <td className="py-2.5 px-3 font-mono">{row.priority}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-500">
                            {row.daysOverdue} days
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 5. Recurring Failures */}
            {activeTab === 'failures' && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {failuresReport.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    <p className="font-semibold text-foreground text-sm">No repeated failures detected</p>
                    <p className="mt-1">Zero instruments with multiple fault occurrences in selected window.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Asset Tag</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Fault Count</th>
                        <th className="py-2.5 px-3 text-center">Critical</th>
                        <th className="py-2.5 px-3 text-right">Latest Incident</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {failuresReport.map((row) => (
                        <tr key={row.equipmentId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">{row.assetTag}</td>
                          <td className="py-2.5 px-3 font-medium text-foreground">{row.equipmentName}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{row.laboratoryName}</td>
                          <td className="py-2.5 px-3 font-mono">{row.status}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-foreground">
                            {row.faultCount}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.criticalCount > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                                {row.criticalCount}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            {new Date(row.lastFaultDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
