import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Laboratory, CreateLaboratoryPayload, UpdateLaboratoryPayload } from '@/types/inventory';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { inventoryApi } from '@/lib/inventoryApi';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface LaboratoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lab: Laboratory) => void;
  initialData?: Laboratory | null;
}

export const LaboratoryFormModal: React.FC<LaboratoryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEdit = !!initialData;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setBuilding(initialData.building);
      setRoomNumber(initialData.roomNumber);
      setDescription(initialData.description || '');
      setActive(initialData.active);
    } else {
      setCode('');
      setName('');
      setBuilding('');
      setRoomNumber('');
      setDescription('');
      setActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && initialData) {
        const payload: UpdateLaboratoryPayload = {
          name: name.trim(),
          building: building.trim(),
          roomNumber: roomNumber.trim(),
          description: description.trim() || undefined,
          active,
        };
        const updated = await inventoryApi.updateLaboratory(initialData.id, payload);
        onSuccess(updated);
      } else {
        const payload: CreateLaboratoryPayload = {
          code: code.trim(),
          name: name.trim(),
          building: building.trim(),
          roomNumber: roomNumber.trim(),
          description: description.trim() || undefined,
        };
        const created = await inventoryApi.createLaboratory(payload);
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: isEdit ? 'Update Failed' : 'Registration Failed',
          status: 500,
          detail: 'Could not communicate with the laboratory registry service.',
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
      aria-labelledby="lab-form-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="lab-form-title" className="text-lg font-semibold text-foreground">
              {isEdit ? 'Update Laboratory Facility' : 'Register Laboratory Facility'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? `Code: ${initialData?.code}` : 'Add a research bay or experimental suite'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lab-code" className="block text-xs font-medium text-foreground mb-1.5">
                Facility Code * {isEdit && <span className="text-muted-foreground font-normal">(Immutable)</span>}
              </label>
              <input
                id="lab-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAB-NANO-01"
                required
                disabled={isEdit}
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="lab-name" className="block text-xs font-medium text-foreground mb-1.5">
                Facility Name *
              </label>
              <input
                id="lab-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nanotechnology Bay"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lab-building" className="block text-xs font-medium text-foreground mb-1.5">
                Campus Building *
              </label>
              <input
                id="lab-building"
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g. Science Quad 2"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="lab-room" className="block text-xs font-medium text-foreground mb-1.5">
                Room Number *
              </label>
              <input
                id="lab-room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Room 402"
                required
                className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lab-desc" className="block text-xs font-medium text-foreground mb-1.5">
              Description & Capabilities
            </label>
            <textarea
              id="lab-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ISO cleanliness class, hazardous materials authorization, primary instrumentation..."
              rows={3}
              className="w-full p-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                id="lab-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent-lime focus:ring-accent-lime"
              />
              <label htmlFor="lab-active" className="text-xs font-medium text-foreground">
                Active facility (permitted for instrument assignment and user bookings)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" size="sm" isLoading={isSubmitting}>
              <CheckCircle className="w-4 h-4 mr-1.5" />
              {isEdit ? 'Save Changes' : 'Register Facility'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
