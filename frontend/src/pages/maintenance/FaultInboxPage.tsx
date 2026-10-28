import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { FaultSeverityBadge } from '@/components/maintenance/FaultSeverityBadge';
import { FaultStatusBadge } from '@/components/maintenance/FaultStatusBadge';
import { TriageFaultModal } from '@/components/maintenance/TriageFaultModal';
import {
  FaultReport,
  FaultReportSummary,
  FaultSeverity,
  FaultStatus,
} from '@/types/maintenance';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { PageResponse } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

export const FaultInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [faultsData, setFaultsData] = useState<PageResponse<FaultReportSummary>>({
    content: [],
    pageNumber: 0,
    pageSize: 15,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FaultStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<FaultSeverity | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [triagingFault, setTriagingFault] = useState<FaultReport | null>(null);

  const isStaff = user?.roles.some(
    (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT'
  );

  const loadFaults = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await maintenanceApi.findFaults({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
        search: searchTerm.trim() || undefined,
        page: currentPage,
        size: 15,
      });
      setFaultsData(data);
    } catch (err) {
      console.error('Failed to load fault reports:', err);
      setErrorMessage('Failed to retrieve fault report records from the maintenance ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, severityFilter, searchTerm, currentPage]);

  useEffect(() => {
    loadFaults();
  }, [loadFaults]);

  const handleOpenTriage = async (faultSummary: FaultReportSummary) => {
    try {
      const full = await maintenanceApi.getFaultById(faultSummary.id);
      setTriagingFault(full);
    } catch (err) {
      console.error('Failed to fetch full fault for triage:', err);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Fault Reports Ledger
              </h1>
              {faultsData.totalElements > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted font-mono font-semibold text-foreground border border-border">
                  {faultsData.totalElements} Records
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Centralized fault reporting, triage workflow, and operational defect tracking across university facilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFaults}
              disabled={isLoading}
              title="Refresh ledger"
              aria-label="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/app/equipment">
              <Button variant="primary" size="sm" className="gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-ink-950" />
                <span>Report Defect</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="Search by fault number, title, equipment tag, or keyword..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FaultStatus | 'ALL');
                setCurrentPage(0);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN (Awaiting Triage)</option>
              <option value="TRIAGED">TRIAGED</option>
              <option value="IN_REPAIR">IN_REPAIR</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as FaultSeverity | 'ALL');
                setCurrentPage(0);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL (Lockdown)</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Loading defect records...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto my-8">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Error Loading Ledger</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{errorMessage}</p>
            <Button variant="secondary" size="sm" onClick={loadFaults}>
              Retry Query
            </Button>
          </div>
        ) : faultsData.content.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-border/80 bg-card text-center space-y-3 max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-accent-lime/10 text-accent-lime mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Fault Reports Matching Criteria</h3>
            <p className="text-xs text-muted-foreground">
              There are no equipment defects recorded matching your search filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
              {faultsData.content.map((fault) => (
                <div
                  key={fault.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  {/* Left: Fault Details */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {fault.faultNumber}
                      </span>
                      <FaultSeverityBadge severity={fault.severity} />
                      <FaultStatusBadge status={fault.status} />
                    </div>

                    <Link
                      to={`/app/faults/${fault.id}`}
                      className="font-semibold text-foreground hover:text-accent-lime transition-colors text-base block"
                    >
                      {fault.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {fault.equipmentName} ({fault.equipmentAssetTag})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-accent-lime" />
                        {fault.laboratoryName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        Reported by {fault.reportedByName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(fault.reportedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <Link to={`/app/faults/${fault.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </Link>

                    {isStaff && fault.status === 'OPEN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenTriage(fault)}
                        className="text-xs gap-1.5"
                      >
                        <Wrench className="w-3.5 h-3.5 text-accent-lime" />
                        <span>Triage Report</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {faultsData.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
                <span>
                  Showing {faultsData.content.length} of {faultsData.totalElements} records (Page{' '}
                  {faultsData.pageNumber + 1} of {faultsData.totalPages})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={faultsData.first}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(faultsData.totalPages - 1, p + 1))}
                    disabled={faultsData.last}
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
      </main>

      {/* Triage Modal */}
      {triagingFault && (
        <TriageFaultModal
          fault={triagingFault}
          isOpen={!!triagingFault}
          onClose={() => setTriagingFault(null)}
          onSuccess={() => {
            setTriagingFault(null);
            loadFaults();
          }}
        />
      )}

      <Footer />
    </div>
  );
};
