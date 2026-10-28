import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi } from '@/lib/analyticsApi';
import { inventoryApi } from '@/lib/inventoryApi';
import { DashboardMetricsResponse, ReportFilterCriteria } from '@/types/analytics';
import { Laboratory } from '@/types/inventory';
import { MetricCard } from '@/components/analytics/MetricCard';
import { CriticalActionsBanner } from '@/components/analytics/CriticalActionsBanner';
import { IncidentTrendChart } from '@/components/analytics/IncidentTrendChart';
import { UtilizationDistributionChart } from '@/components/analytics/UtilizationDistributionChart';
import {
  Activity,
  Cpu,
  Calendar,
  Wrench,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  FileText,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isStaff = user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT');
  const canAccessReports = isStaff || user?.roles.some((r) => r === 'ROLE_TECHNICIAN');

  // Load labs for dropdown
  useEffect(() => {
    inventoryApi
      .getLaboratories()
      .then((data) => setLaboratories(data))
      .catch(() => {});
  }, []);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - timeRangeDays * 24 * 3600 * 1000);

      const filter: ReportFilterCriteria = {
        fromTimestamp: from.toISOString(),
        toTimestamp: now.toISOString(),
        laboratoryId: selectedLabId || undefined,
      };

      const data = await analyticsApi.getDashboardMetrics(filter);
      setMetrics(data);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  }, [timeRangeDays, selectedLabId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-accent-lime" />
              Operational Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time telemetry, scheduling utilization, and laboratory lifecycle analytics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canAccessReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/app/reports')}
                className="gap-1.5"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Reports & Export</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMetrics}
              title="Refresh dashboard"
              className="px-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-lime' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card/60">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground uppercase tracking-wider">
              Time Window:
            </span>
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              {[
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 },
                { label: '90 Days', days: 90 },
              ].map((t) => (
                <button
                  key={t.days}
                  onClick={() => setTimeRangeDays(t.days)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    timeRangeDays === t.days
                      ? 'bg-muted text-foreground border border-border shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {laboratories.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                Facility:
              </span>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="rounded-lg border border-border bg-background py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent-lime"
              >
                <option value="">All Laboratory Facilities</option>
                {laboratories.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Critical Actions Queue */}
        {metrics && metrics.criticalActions.length > 0 && (
          <CriticalActionsBanner items={metrics.criticalActions} />
        )}

        {/* Metric Cards Grid */}
        {isLoading && !metrics ? (
          <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p>Aggregating operational metrics...</p>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Active Instruments"
                value={metrics.totalActiveEquipment}
                description={
                  metrics.unavailableEquipment > 0
                    ? `${metrics.unavailableEquipment} currently in maintenance`
                    : '100% operational'
                }
                icon={Cpu}
                variant="default"
                onClick={() => navigate('/app/equipment')}
              />

              <MetricCard
                title="Pending Approvals"
                value={metrics.pendingReservations}
                description="Requests awaiting review"
                icon={Clock}
                variant={metrics.pendingReservations > 0 ? 'accent' : 'default'}
                onClick={() => (isStaff ? navigate('/app/approvals') : navigate('/app/reservations'))}
              />

              <MetricCard
                title="Open Faults"
                value={metrics.openFaults}
                description={
                  metrics.criticalFaults > 0
                    ? `${metrics.criticalFaults} critical incidents`
                    : 'Zero critical blockers'
                }
                icon={AlertTriangle}
                variant={metrics.criticalFaults > 0 ? 'critical' : metrics.openFaults > 0 ? 'warning' : 'default'}
                onClick={() => navigate('/app/faults')}
              />

              <MetricCard
                title="Active Work Orders"
                value={metrics.activeWorkOrders}
                description={
                  metrics.overdueWorkOrders > 0
                    ? `${metrics.overdueWorkOrders} overdue orders`
                    : 'All orders on schedule'
                }
                icon={Wrench}
                variant={metrics.overdueWorkOrders > 0 ? 'critical' : 'default'}
                onClick={() => navigate('/app/work-orders')}
              />
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Overall Utilization"
                value={
                  metrics.overallUtilizationPercentage != null
                    ? `${metrics.overallUtilizationPercentage.toFixed(1)}%`
                    : '0.0%'
                }
                unit={`(${metrics.totalBookedHours.toFixed(1)} hrs booked)`}
                description="Operating capacity utilized"
                icon={TrendingUp}
                variant="accent"
              />

              <MetricCard
                title="Upcoming Bookings"
                value={metrics.upcomingReservations}
                description="Scheduled in upcoming horizon"
                icon={Calendar}
                variant="default"
                onClick={() => navigate('/app/reservations')}
              />

              <MetricCard
                title="Mean Time To Repair (MTTR)"
                value={
                  metrics.meanTimeToRepairHours != null
                    ? `${metrics.meanTimeToRepairHours.toFixed(1)}h`
                    : 'N/A'
                }
                description="Average completion turnaround"
                icon={Wrench}
                variant="default"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IncidentTrendChart data={metrics.incidentTrends} />
              <UtilizationDistributionChart
                overallPercentage={metrics.overallUtilizationPercentage}
                totalCapacityHours={metrics.totalCapacityHours}
                totalBookedHours={metrics.totalBookedHours}
              />
            </div>

            {/* Equipment with Recurring Faults Table */}
            {metrics.topRepeatedFailures.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-subtle text-card-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                      Equipment with Recurring Incidents (Repeated Failures)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Instruments with 2 or more reported faults requiring diagnostic review
                    </p>
                  </div>
                  {isStaff && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/app/reports')}
                      className="text-xs text-primary gap-1"
                    >
                      <span>View in Reports</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Asset Tag</th>
                        <th className="py-2.5 px-3">Instrument</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Faults</th>
                        <th className="py-2.5 px-3 text-center">Critical</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {metrics.topRepeatedFailures.map((row) => (
                        <tr key={row.equipmentId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                            {row.assetTag}
                          </td>
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
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/app/equipment/${row.equipmentId}`)}
                              className="h-6 px-2 text-[11px]"
                            >
                              Profile
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};
