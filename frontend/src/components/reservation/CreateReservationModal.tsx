import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentDetail } from '@/types/inventory';
import { CreateReservationPayload, Reservation } from '@/types/reservation';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { reservationApi } from '@/lib/reservationApi';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  CalendarCheck2,
} from 'lucide-react';

interface CreateReservationModalProps {
  equipment: EquipmentDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

export const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Format initial date as tomorrow (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialDate = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(initialDate);
  const [startTimeStr, setStartTimeStr] = useState('10:00');
  const [endTimeStr, setEndTimeStr] = useState('12:00');
  const [purpose, setPurpose] = useState('');

  // Pre-flight availability check state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    reason: string;
  } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  // Generate ISO timestamps from date and time inputs
  const computeTimestamps = (): { startIso: string; endIso: string } | null => {
    if (!date || !startTimeStr || !endTimeStr) return null;
    const start = new Date(`${date}T${startTimeStr}:00`);
    const end = new Date(`${date}T${endTimeStr}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  };

  // Pre-flight check when date or times change
  useEffect(() => {
    if (!isOpen) return;

    const timestamps = computeTimestamps();
    if (!timestamps) {
      setAvailabilityStatus(null);
      return;
    }

    const start = new Date(timestamps.startIso);
    const end = new Date(timestamps.endIso);

    if (start >= end) {
      setAvailabilityStatus({
        available: false,
        reason: 'Start time must strictly precede end time.',
      });
      return;
    }

    let active = true;
    setIsCheckingAvailability(true);

    const timer = setTimeout(async () => {
      try {
        const result = await reservationApi.checkAvailability(
          equipment.id,
          timestamps.startIso,
          timestamps.endIso
        );
        if (active) {
          setAvailabilityStatus({
            available: result.available,
            reason: result.reason,
          });
        }
      } catch (err) {
        if (active) {
          console.error('Availability check failed:', err);
        }
      } finally {
        if (active) setIsCheckingAvailability(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [date, startTimeStr, endTimeStr, equipment.id, isOpen]);

  // Calculate duration in hours/minutes
  const getDurationDisplay = (): string => {
    const timestamps = computeTimestamps();
    if (!timestamps) return '';
    const start = new Date(timestamps.startIso).getTime();
    const end = new Date(timestamps.endIso).getTime();
    if (end <= start) return 'Invalid interval';

    const diffMinutes = Math.round((end - start) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hr ${minutes} min`;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const timestamps = computeTimestamps();
    if (!timestamps) {
      setError({
        title: 'Invalid Times',
        status: 400,
        detail: 'Please specify a valid reservation date, start time, and end time.',
      });
      setIsSubmitting(false);
      return;
    }

    const payload: CreateReservationPayload = {
      equipmentId: equipment.id,
      startTime: timestamps.startIso,
      endTime: timestamps.endIso,
      purpose: purpose.trim(),
    };

    try {
      const created = await reservationApi.createReservation(payload);
      onSuccess(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Booking Request Failed',
          status: 500,
          detail: 'An unexpected communication error occurred. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="booking-modal-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-accent-lime" />
              Schedule Instrument Reservation
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-medium text-foreground">{equipment.assetTag}</span> — {equipment.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{error.title}</p>
              <p>{error.detail}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Facility location info */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block">Assigned Research Bay</span>
              <span className="font-semibold text-foreground">{equipment.laboratory.name}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block">Location</span>
              <span className="text-foreground">{equipment.laboratory.building} ({equipment.laboratory.roomNumber})</span>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="res-date" className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent-lime" />
              Reservation Date *
            </label>
            <input
              id="res-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Time Picker Row: Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="res-start" className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent-lime" />
                Start Time (inclusive) *
              </label>
              <input
                id="res-start"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                step="900"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="res-end" className="block text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent-lime" />
                End Time (exclusive) *
              </label>
              <input
                id="res-end"
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                step="900"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Interval Duration & Real-time Availability Feedback */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-border/70 bg-card">
            <span className="text-muted-foreground">
              Total Duration:{' '}
              <strong className="text-foreground font-mono">{getDurationDisplay()}</strong>
            </span>

            {isCheckingAvailability ? (
              <span className="text-muted-foreground animate-pulse">Checking slot availability...</span>
            ) : availabilityStatus ? (
              availabilityStatus.available ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Slot Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Slot Unavailable
                </span>
              )
            ) : null}
          </div>

          {/* Research Purpose */}
          <div>
            <label htmlFor="res-purpose" className="block text-xs font-medium text-foreground mb-1.5">
              Research Objective & Experimental Protocol *
            </label>
            <textarea
              id="res-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Fluorescence imaging of live mammalian neuronal cultures for senior thesis..."
              rows={3}
              required
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Policy Information Box */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Info className="w-3.5 h-3.5 text-accent-lime" />
              Scheduling Policies & Interval Invariants
            </div>
            <p>
              • Modeled as a <strong>half-open interval [start, end)</strong>: adjacent slots can touch without collision.
            </p>
            <p>
              • Maximum slot length: <strong>8 hours</strong> • Advance booking window: up to <strong>30 days</strong>.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="lime"
              size="sm"
              isLoading={isSubmitting}
              disabled={availabilityStatus?.available === false}
            >
              Submit Booking Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
