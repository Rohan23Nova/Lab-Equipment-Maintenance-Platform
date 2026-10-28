import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { ReservationStatusBadge } from '@/components/reservation/ReservationStatusBadge';
import { CancelReservationModal } from '@/components/reservation/CancelReservationModal';
import { ReservationStatus, ReservationSummary } from '@/types/reservation';
import { reservationApi } from '@/lib/reservationApi';
import { PageResponse } from '@/types/inventory';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export const MyReservationsPage: React.FC = () => {
  const toast = useToast();
  const [reservationsData, setReservationsData] = useState<PageResponse<ReservationSummary> | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingReservation, setCancellingReservation] = useState<ReservationSummary | null>(null);

  const loadReservations = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const statusParam = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const data = await reservationApi.getMyReservations(statusParam, currentPage, 10);
      setReservationsData(data);
    } catch (err) {
      console.error('Failed to load user reservations:', err);
      setErrorMessage('Failed to load your equipment reservations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, currentPage]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleStatusFilterChange = (status: ReservationStatus | 'ALL') => {
    setSelectedStatus(status);
    setCurrentPage(0);
  };

  const formatInterval = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const datePart = s.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const startTimePart = s.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const endTimePart = e.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const durationMinutes = Math.round((e.getTime() - s.getTime()) / (1000 * 60));
      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

      return { datePart, timeRange: `${startTimePart} – ${endTimePart}`, durationStr };
    } catch {
      return { datePart: startIso, timeRange: endIso, durationStr: '' };
    }
  };

  const isCancellable = (status: ReservationStatus) => {
    return status === 'PENDING' || status === 'APPROVED';
  };

  const statusFilters: { label: string; value: ReservationStatus | 'ALL' }[] = [
    { label: 'All Bookings', value: 'ALL' },
    { label: 'Pending Approval', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <AppLayout breadcrumbs={[{ label: 'My Reservations', href: '/app/reservations' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                My Instrument Reservations
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Track equipment reservations, approval statuses, and upcoming scheduled laboratory sessions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadReservations}
              disabled={isLoading}
              title="Refresh reservations"
              aria-label="Refresh reservations"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/app/equipment">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5 text-ink-950" />
                <span>Book Instrument</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-border/60">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilterChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedStatus === tab.value
                  ? 'bg-accent-lime text-ink-950 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Retrieving reservation ledger...</p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto my-8">
            <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Unable to Load Reservations</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{errorMessage}</p>
            <Button variant="secondary" size="sm" onClick={loadReservations}>
              Retry Query
            </Button>
          </div>
        ) : !reservationsData || reservationsData.content.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-border/80 bg-card text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-accent-lime/10 text-accent-lime mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">No Reservations Found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedStatus === 'ALL'
                  ? "You have not reserved any laboratory instruments yet. Explore the equipment inventory to find and book instruments."
                  : `You have no reservations currently in '${selectedStatus}' state.`}
              </p>
            </div>
            <Link to="/app/equipment">
              <Button variant="primary" size="sm" className="gap-1.5 mt-2">
                <span>Browse Equipment Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table / Cards */}
            <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
              {reservationsData.content.map((res) => {
                const { datePart, timeRange, durationStr } = formatInterval(res.startTime, res.endTime);
                return (
                  <div
                    key={res.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    {/* Left: Instrument & Laboratory Info */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/app/equipment/${res.equipmentId}`}
                          className="font-semibold text-foreground hover:text-accent-lime transition-colors text-base truncate"
                        >
                          {res.equipmentName}
                        </Link>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                          {res.equipmentAssetTag}
                        </span>
                        <ReservationStatusBadge status={res.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-accent-lime" />
                          {res.laboratoryName} ({res.laboratoryCode})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {datePart} ({timeRange})
                        </span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{durationStr}</span>
                      </div>

                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        Purpose: "{res.purpose}"
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <Link to={`/app/equipment/${res.equipmentId}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Instrument
                        </Button>
                      </Link>

                      {isCancellable(res.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingReservation(res)}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {reservationsData.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
                <span>
                  Showing {reservationsData.content.length} of {reservationsData.totalElements} records (Page{' '}
                  {reservationsData.pageNumber + 1} of {reservationsData.totalPages})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={reservationsData.first}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(reservationsData.totalPages - 1, p + 1))}
                    disabled={reservationsData.last}
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

      {/* Cancel Reservation Modal */}
      {cancellingReservation && (
        <CancelReservationModal
          isOpen={!!cancellingReservation}
          reservation={cancellingReservation}
          onClose={() => setCancellingReservation(null)}
          onSuccess={() => {
            toast.info('Reservation successfully cancelled.');
            setCancellingReservation(null);
            loadReservations();
          }}
        />
      )}
    </AppLayout>
  );
};
