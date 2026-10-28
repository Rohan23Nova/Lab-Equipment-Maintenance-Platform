import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EquipmentDetail, EquipmentDocumentType, CreateDocumentPayload, EquipmentDocument } from '@/types/inventory';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { inventoryApi } from '@/lib/inventoryApi';
import { AlertCircle, FilePlus, X } from 'lucide-react';

interface AttachDocumentModalProps {
  equipment: EquipmentDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: EquipmentDocument) => void;
}

export const AttachDocumentModal: React.FC<AttachDocumentModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState<EquipmentDocumentType>('USER_MANUAL');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateDocumentPayload = {
        title: title.trim(),
        documentType,
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        fileSizeBytes: 1024 * 512, // Standard nominal metadata
        mimeType: 'application/pdf',
      };
      const created = await inventoryApi.addDocument(equipment.id, payload);
      onSuccess(created);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Attachment Failed',
          status: 500,
          detail: 'Could not attach technical documentation to the instrument.',
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
      aria-labelledby="doc-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div>
            <h2 id="doc-modal-title" className="text-lg font-semibold text-foreground">
              Attach Technical Document
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instrument: <span className="font-mono text-foreground">{equipment.assetTag}</span> ({equipment.name})
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
          <div>
            <label htmlFor="doc-title" className="block text-xs font-medium text-foreground mb-1.5">
              Document Title *
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laser Alignment and Safety Manual v2.4"
              required
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="doc-type" className="block text-xs font-medium text-foreground mb-1.5">
              Classification Type *
            </label>
            <select
              id="doc-type"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as EquipmentDocumentType)}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="USER_MANUAL">User Operation Manual</option>
              <option value="SAFETY_GUIDE">Safety Protocol & PPE Guide</option>
              <option value="CALIBRATION_CERT">Factory Calibration Certificate</option>
              <option value="MAINTENANCE_LOG">Preventative Maintenance Log</option>
              <option value="OTHER">Other Technical Specification</option>
            </select>
          </div>

          <div>
            <label htmlFor="doc-url" className="block text-xs font-medium text-foreground mb-1.5">
              Document URL / Secure Repository Path *
            </label>
            <input
              id="doc-url"
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://docs.university.edu/facilities/imaging/zeiss-manual.pdf"
              required
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="file-name" className="block text-xs font-medium text-foreground mb-1.5">
              Filename (optional)
            </label>
            <input
              id="file-name"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. zeiss-axio7-operator-guide.pdf"
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="lime" size="sm" isLoading={isSubmitting}>
              <FilePlus className="w-4 h-4 mr-1.5" />
              Attach Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
