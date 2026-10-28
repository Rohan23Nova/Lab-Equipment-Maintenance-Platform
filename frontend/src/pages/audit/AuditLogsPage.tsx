import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { auditApi } from '@/lib/auditApi';
import { AuditEntityType, AuditLogItem } from '@/types/audit';
import { PageResponse } from '@/types/inventory';
import { AuditActionBadge } from '@/components/audit/AuditActionBadge';
import { AuditEntityTypeBadge } from '@/components/audit/AuditEntityTypeBadge';
import { AuditDetailModal } from '@/components/audit/AuditDetailModal';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logsData, setLogsData] = useState<PageResponse<AuditLogItem>>({
    content: [],
    pageNumber: 0,
    pageSize: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [selectedEntityType, setSelectedEntityType] = useState<AuditEntityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.searchAuditLogs({
        entityType: selectedEntityType === 'ALL' ? undefined : selectedEntityType,
        search: debouncedSearch.trim() || undefined,
        page: currentPage,
        size: 20,
      });
      setLogsData(data);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntityType, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-accent-lime" />
              Institutional Audit Trail
            </h1>
            <p className="text-sm text-muted-foreground">
              Immutable, transaction-bound activity ledger tracking administrative, maintenance, and reservation events.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-lime' : ''}`} />
              <span>Refresh Trail</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-card/50">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by actor name, summary keyword, or asset tag / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent-lime placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value as AuditEntityType | 'ALL');
                setCurrentPage(0);
              }}
              className="w-full text-sm rounded-lg border border-border bg-background py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-lime"
            >
              <option value="ALL">All Domain Entities</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="RESERVATION">Reservations</option>
              <option value="FAULT_REPORT">Fault Reports</option>
              <option value="WORK_ORDER">Work Orders</option>
              <option value="USER">User Accounts</option>
              <option value="SYSTEM">System Config</option>
            </select>
          </div>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Displaying <strong className="text-foreground">{logsData.content.length}</strong> of{' '}
            <strong className="text-foreground">{logsData.totalElements}</strong> recorded events
          </span>
          <span className="font-mono text-[11px]">Strict ISO-8601 UTC Grounding</span>
        </div>

        {/* Table View */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-accent-lime mb-2" />
                      <p className="text-xs">Querying audit ledger...</p>
                    </td>
                  </tr>
                ) : logsData.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="font-medium text-foreground">No audit entries match query</p>
                      <p className="text-xs mt-0.5">Try widening your search terms or clearing filters.</p>
                    </td>
                  </tr>
                ) : (
                  logsData.content.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{log.actorName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <AuditActionBadge action={log.action} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <AuditEntityTypeBadge entityType={log.entityType} />
                          {log.entityIdentifier && (
                            <span className="font-mono text-xs font-semibold text-primary">
                              {log.entityIdentifier}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground/90 max-w-xs sm:max-w-md truncate">
                        {log.summary}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground group-hover:text-foreground"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {logsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Page {logsData.pageNumber + 1} of {logsData.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={logsData.pageNumber === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={logsData.last}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Details Modal */}
      <AuditDetailModal
        log={selectedLog}
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
