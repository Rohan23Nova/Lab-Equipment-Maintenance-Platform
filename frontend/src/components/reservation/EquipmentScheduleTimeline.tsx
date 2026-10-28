import React, { useState, useEffect, useCallback } from 'react';
import { EquipmentSchedule } from '@/types/reservation';
import { reservationApi } from '@/lib/reservationApi';
import { ReservationStatusBadge } from '@/components/reservation/ReservationStatusBadge';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, RefreshCw, Plus, User, AlertCircle } from 'lucide-react';

interface EquipmentScheduleTimelineProps {
  equipmentId: string;
  equipmentName?: string;
  onOpenBookingModal?: () => void;
  isReservable?: boolean;
}

export const EquipmentScheduleTimeline: React.FC<EquipmentScheduleTimelineProps> = ({
  equipmentId,
  equipmentName,
  onOpenBookingModal,
  isReservable = true,
}) => {
  const [schedule, setSchedule] = useState<EquipmentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Time window: Default next 14 days
  const [daysWindow, setDaysWindow] = useState<number>(14);

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const from = new Date().toISOString();
      const to = new Date(Date.now() + daysWindow * 24 * 60 * 60 * 1000).toISOString();
      const data = await reservationApi.getEquipmentSchedule(equipmentId, from, to);
      setSchedule(data);
    } catch (err) {
      console.error('Failed to load equipment schedule:', err);
      setErrorMessage('Unable to retrieve schedule for this instrument.');
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId, daysWindow]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const formatInterval = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const datePart = s.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
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

      return { datePart, timePart: `${startTimePart} – ${endTimePart}`, durationStr };
    } catch {
      return { datePart: startIso, timePart: endIso, durationStr: '' };
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-lime" />
            Schedule & Active Bookings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time interval timeline. Time slots use half-open boundaries [start, end) to prevent double-booking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Window selection */}
          <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-xs">
            <button
              onClick={() => setDaysWindow(7)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                daysWindow === 7 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysWindow(14)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                daysWindow === 14 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setDaysWindow(30)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                daysWindow === 30 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={loadSchedule}
            disabled={isLoading}
            title="Refresh schedule"
            aria-label="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {onOpenBookingModal && isReservable && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenBookingModal}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-ink-950" />
              <span>Reserve</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin text-accent-lime" />
          <span className="text-xs font-medium">Checking reservation schedule...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : !schedule || schedule.activeSlots.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
          <div className="w-10 h-10 rounded-full bg-accent-lime/10 text-accent-lime mx-auto flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">No Confirmed or Pending Reservations</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              There are no active bookings for {equipmentName || 'this instrument'} over the next {daysWindow} days. The instrument is completely available.
            </p>
          </div>
          {onOpenBookingModal && isReservable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenBookingModal}
              className="mt-2 text-xs"
            >
              Book Time Slot
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {schedule.activeSlots.length} active reservation{schedule.activeSlots.length > 1 ? 's' : ''} in the next {daysWindow} days
            </span>
            <span className="font-mono text-[11px]">UTC / Local Synchronized</span>
          </div>

          <div className="divide-y divide-border/60 rounded-lg border border-border/80 overflow-hidden bg-background">
            {schedule.activeSlots.map((slot) => {
              const { datePart, timePart, durationStr } = formatInterval(slot.startTime, slot.endTime);
              return (
                <div
                  key={slot.reservationId}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-md bg-muted/60 text-muted-foreground shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{datePart}</span>
                        <span className="text-xs text-muted-foreground font-mono">({durationStr})</span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        {timePart}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{slot.bookedByName}</span>
                    </div>
                    <ReservationStatusBadge status={slot.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
