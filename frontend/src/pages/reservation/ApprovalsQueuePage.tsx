import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { RejectReservationModal } from '@/components/reservation/RejectReservationModal';
import { ReservationSummary } from '@/types/reservation';
import { reservationApi } from '@/lib/reservationApi';
import { PageResponse } from '@/types/inventory';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle,
  XCircle,
  User,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Inbox,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';

export const ApprovalsQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [approvalsData, setApprovalsData] = useState<PageResponse<ReservationSummary> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingReservation, setRejectingReservation] = useState<ReservationSummary | null>(null);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await reservationApi.getApprovalsQueue(currentPage, 15);
      setApprovalsData(data);
    } catch (err) {
      console.error('Failed to load approvals queue:', err);
      setErrorMessage('Failed to load pending reservation approvals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const handleApprove = async (res: ReservationSummary) => {
    // Front guard for self-approval
    if (user && res.userId === user.id) {
      setErrorMessage('Self-approval invariant violation: You cannot approve your own reservation request.');
      return;
    }

    setActionInProgressId(res.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await reservationApi.approveReservation(res.id);
      setSuccessMessage(`Reservation for ${res.equipmentName} by ${res.userFullName} has been approved.`);
      await loadApprovals();
    } catch (err: unknown) {
      console.error('Failed to approve reservation:', err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(
        apiErr.response?.data?.detail || 'Failed to approve reservation. Another action may have conflicted.'
      );
    } finally {
      setActionInProgressId(null);
    }
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Reservation Approvals Queue
              </h1>
              {approvalsData && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  {approvalsData.totalElements} Pending
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Review and triage instrument reservation requests submitted by students and faculty researchers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApprovals}
              disabled={isLoading}
              title="Refresh queue"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Banners */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="hover:underline font-medium text-emerald-700 dark:text-emerald-300 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="hover:underline font-medium text-rose-700 dark:text-rose-300 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Queue Content */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Scanning pending approvals queue...</p>
          </div>
        ) : !approvalsData || approvalsData.content.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-border/80 bg-card text-center space-y-3 max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Queue is Completely Clear</h3>
            <p className="text-xs text-muted-foreground">
              All reservation requests have been processed. New student and faculty submissions will appear here automatically for triage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-border/80 rounded-xl border border-border/80 bg-card overflow-hidden shadow-subtle">
              {approvalsData.content.map((res) => {
                const { datePart, timeRange, durationStr } = formatInterval(res.startTime, res.endTime);
                const isSelf = user?.id === res.userId;
                const isProcessing = actionInProgressId === res.id;

                return (
                  <div
                    key={res.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    {/* Left: Request details */}
                    <div className="space-y-2 min-w-0">
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
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Awaiting Decision
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="w-3.5 h-3.5 text-accent-lime" />
                          {res.userFullName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {res.laboratoryName} ({res.laboratoryCode})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {datePart} ({timeRange})
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{durationStr}</span>
                      </div>

                      <p className="text-xs text-muted-foreground italic bg-muted/40 p-2 rounded-lg border border-border/40">
                        <span className="font-semibold not-italic text-foreground">Statement of Purpose: </span>
                        "{res.purpose}"
                      </p>

                      {isSelf && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 pt-0.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Self-approval guard: As the requesting user, you cannot approve this booking.</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRejectingReservation(res)}
                        disabled={isProcessing}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(res)}
                        disabled={isSelf || isProcessing}
                        title={isSelf ? 'Cannot self-approve' : 'Approve reservation'}
                        className="text-xs gap-1.5 text-ink-950 font-semibold"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Approve Booking</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {approvalsData.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2 pt-2">
                <span>
                  Showing {approvalsData.content.length} of {approvalsData.totalElements} pending requests
                  (Page {approvalsData.pageNumber + 1} of {approvalsData.totalPages})
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={approvalsData.first}
                    className="h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(approvalsData.totalPages - 1, p + 1))}
                    disabled={approvalsData.last}
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

      {/* Reject Reservation Modal */}
      {rejectingReservation && (
        <RejectReservationModal
          isOpen={!!rejectingReservation}
          reservation={rejectingReservation}
          onClose={() => setRejectingReservation(null)}
          onSuccess={() => {
            setRejectingReservation(null);
            setSuccessMessage(`Reservation request for ${rejectingReservation.equipmentName} has been rejected.`);
            loadApprovals();
          }}
        />
      )}

      <Footer />
    </div>
  );
};
