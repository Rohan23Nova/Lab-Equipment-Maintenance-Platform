import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EquipmentStatusBadge, EquipmentConditionBadge } from '@/components/inventory/EquipmentBadges';
import { EquipmentStatusModal } from '@/components/inventory/EquipmentStatusModal';
import { EquipmentFormModal } from '@/components/inventory/EquipmentFormModal';
import { ArchiveEquipmentModal } from '@/components/inventory/ArchiveEquipmentModal';
import { AttachDocumentModal } from '@/components/inventory/AttachDocumentModal';
import { EquipmentScheduleTimeline } from '@/components/reservation/EquipmentScheduleTimeline';
import { CreateReservationModal } from '@/components/reservation/CreateReservationModal';
import { EquipmentDetail, EquipmentDocumentType } from '@/types/inventory';
import { inventoryApi } from '@/lib/inventoryApi';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  FileCheck2,
  HardDrive,
  History,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Archive,
  ExternalLink,
  Plus,
} from 'lucide-react';

export const EquipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'audit' | 'documents'>('overview');

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isAttachDocModalOpen, setIsAttachDocModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  // Role permissions
  const canUpdateStatus =
    user?.roles.some(
      (r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT' || r === 'ROLE_TECHNICIAN'
    ) ?? false;

  const canEditEquipment =
    user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT') ?? false;

  const loadEquipment = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await inventoryApi.getEquipmentById(id);
      setEquipment(data);
    } catch (err) {
      console.error('Failed to load instrument details:', err);
      setErrorMessage('The requested laboratory instrument could not be located in the ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not recorded';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getDocTypeBadge = (type: EquipmentDocumentType) => {
    switch (type) {
      case 'USER_MANUAL':
        return <Badge variant="neutral">User Manual</Badge>;
      case 'SAFETY_GUIDE':
        return <Badge variant="maintenance">Safety Guide</Badge>;
      case 'CALIBRATION_CERT':
        return <Badge variant="lime">Calibration</Badge>;
      case 'MAINTENANCE_LOG':
        return <Badge variant="calibration">Maintenance Log</Badge>;
      default:
        return <Badge variant="outline">Document</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6">
          <Link
            to="/app/equipment"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Equipment Inventory
          </Link>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm font-medium">Retrieving instrument specifications and audit trail...</p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && errorMessage && (
          <div className="p-8 rounded-xl border border-rose-500/30 bg-rose-500/10 text-center max-w-xl mx-auto my-12">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground">Instrument Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{errorMessage}</p>
            <Button variant="secondary" onClick={() => navigate('/app/equipment')}>
              Return to Inventory
            </Button>
          </div>
        )}

        {/* Loaded Equipment Profile */}
        {!isLoading && equipment && (
          <div className="space-y-6">
            {/* Header Hero Card */}
            <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                      {equipment.assetTag}
                    </span>
                    <EquipmentStatusBadge status={equipment.status} />
                    <EquipmentConditionBadge condition={equipment.condition} />
                    <Badge variant="outline" className="text-xs">
                      {equipment.category.name}
                    </Badge>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {equipment.name}
                  </h1>

                  <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                    <span>{equipment.manufacturer}</span>
                    <span>•</span>
                    <span className="font-medium text-foreground">{equipment.model}</span>
                    {equipment.serialNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-xs">SN: {equipment.serialNumber}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {equipment.status !== 'ARCHIVED' && equipment.status !== 'UNDER_MAINTENANCE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsReserveModalOpen(true)}
                      className="gap-1.5 text-ink-950 font-semibold"
                    >
                      <Calendar className="w-4 h-4 text-ink-950" />
                      <span>Reserve Instrument</span>
                    </Button>
                  )}

                  {canUpdateStatus && equipment.status !== 'ARCHIVED' && (
                    <Button variant="secondary" size="sm" onClick={() => setIsStatusModalOpen(true)}>
                      <RefreshCw className="w-4 h-4 mr-1.5 text-accent-lime" />
                      Transition Status
                    </Button>
                  )}

                  {canEditEquipment && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Edit Details
                    </Button>
                  )}

                  {canEditEquipment && equipment.status !== 'ARCHIVED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setIsArchiveModalOpen(true)}
                    >
                      <Archive className="w-4 h-4 mr-1.5" />
                      Decommission
                    </Button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-6 mt-8 pt-4 border-t border-border/80 text-sm">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-accent-lime text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Specifications & Facility
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'schedule'
                      ? 'border-accent-lime text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-accent-lime" />
                  <span>Schedule & Availability</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'audit'
                      ? 'border-accent-lime text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Audit Trail</span>
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-muted font-mono">
                    {equipment.statusHistory.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`pb-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === 'documents'
                      ? 'border-accent-lime text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>Documentation</span>
                  <span className="text-xs px-1.5 py-0.2 rounded-full bg-muted font-mono">
                    {equipment.documents.length}
                  </span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: Overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Overview, description, specs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Facility Assignment Card */}
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                      <MapPin className="w-4 h-4 text-accent-lime" />
                      Facility Assignment & Custody
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                        <span className="text-xs text-muted-foreground block mb-0.5">Laboratory Facility</span>
                        <span className="font-semibold text-foreground">{equipment.laboratory.name}</span>
                        <span className="font-mono text-xs text-muted-foreground block">
                          Code: {equipment.laboratory.code}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                        <span className="text-xs text-muted-foreground block mb-0.5">Location</span>
                        <span className="font-semibold text-foreground">{equipment.laboratory.building}</span>
                        <span className="text-xs text-muted-foreground block">
                          {equipment.laboratory.roomNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-accent-lime" />
                      Instrument Profile & Purpose
                    </h2>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {equipment.description || 'No descriptive overview recorded for this instrument.'}
                    </p>
                  </div>

                  {/* Technical Specifications Card */}
                  {equipment.specificationsJson && (
                    <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
                      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                        <HardDrive className="w-4 h-4 text-accent-lime" />
                        Hardware Specifications & Parameters
                      </h2>
                      <div className="rounded-lg bg-muted/50 p-4 border border-border/70 font-mono text-xs overflow-x-auto text-foreground">
                        <pre className="whitespace-pre-wrap">{equipment.specificationsJson}</pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Metadata & Financial Details */}
                <div className="space-y-6">
                  {/* Financial & Warranty Details */}
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle space-y-4">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent-lime" />
                      Lifecycle & Capital Metadata
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Acquisition Cost
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {formatCurrency(equipment.purchaseCost)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Commission Date
                        </span>
                        <span className="text-foreground">{formatDate(equipment.purchaseDate)}</span>
                      </div>

                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          Warranty Expiration
                        </span>
                        <span className="text-foreground">{formatDate(equipment.warrantyExpiration)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Classification</span>
                        <span className="text-xs font-mono font-medium text-foreground">
                          {equipment.category.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Timestamps */}
                  <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle text-xs text-muted-foreground space-y-2">
                    <h3 className="font-semibold text-foreground text-sm mb-3">Institutional Metadata</h3>
                    <div>
                      <span className="block">Ledger Registration:</span>
                      <span className="font-mono text-foreground">{formatDateTime(equipment.createdAt)}</span>
                    </div>
                    <div>
                      <span className="block">Last Profile Modification:</span>
                      <span className="font-mono text-foreground">{formatDateTime(equipment.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Schedule & Reservations */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <EquipmentScheduleTimeline
                  key={scheduleRefreshKey}
                  equipmentId={equipment.id}
                  equipmentName={equipment.name}
                  onOpenBookingModal={() => setIsReserveModalOpen(true)}
                  isReservable={equipment.status !== 'ARCHIVED' && equipment.status !== 'UNDER_MAINTENANCE'}
                />
              </div>
            )}

            {/* TAB CONTENT 2: Audit History Ledger */}
            {activeTab === 'audit' && (
              <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <History className="w-5 h-5 text-accent-lime" />
                      Operational Status Audit Ledger
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Immutable log of all operational status changes, technician tickets, and reasons.
                    </p>
                  </div>
                  {canUpdateStatus && (
                    <Button variant="lime" size="sm" onClick={() => setIsStatusModalOpen(true)}>
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                      Record Transition
                    </Button>
                  )}
                </div>

                {equipment.statusHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No historical status transitions recorded yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                    {equipment.statusHistory.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-accent-lime border-2 border-background ring-2 ring-accent-lime/30" />

                        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-xs">
                              {item.previousStatus && (
                                <>
                                  <EquipmentStatusBadge status={item.previousStatus} />
                                  <span className="text-muted-foreground">→</span>
                                </>
                              )}
                              <EquipmentStatusBadge status={item.newStatus} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>

                          {item.reason && (
                            <p className="text-sm font-semibold text-foreground mt-1.5">
                              {item.reason}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line leading-relaxed">
                              {item.notes}
                            </p>
                          )}

                          <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                            <span>
                              Recorded by:{' '}
                              <strong className="text-foreground">
                                {item.changedByName || 'System Administrator'}
                              </strong>
                            </span>
                            {item.changedByEmail && (
                              <span className="font-mono">{item.changedByEmail}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Attached Documents */}
            {activeTab === 'documents' && (
              <div className="p-6 rounded-xl border border-border/80 bg-card shadow-subtle">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/80">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-accent-lime" />
                      Technical Documentation & Compliance
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Operator manuals, safety protocols, calibration certificates, and service logs.
                    </p>
                  </div>
                  {canEditEquipment && (
                    <Button variant="lime" size="sm" onClick={() => setIsAttachDocModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Attach Document
                    </Button>
                  )}
                </div>

                {equipment.documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No documentation files attached to this instrument.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipment.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between hover:border-border transition-colors group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {getDocTypeBadge(doc.documentType)}
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {formatDate(doc.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                            {doc.fileName}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">
                            {doc.uploadedByName ? `Uploaded by ${doc.uploadedByName}` : 'Institutional Archive'}
                          </span>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Open Link
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {isStatusModalOpen && equipment && (
        <EquipmentStatusModal
          equipment={equipment}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={() => loadEquipment()}
          onUpdateStatus={inventoryApi.updateEquipmentStatus}
        />
      )}

      {isEditModalOpen && equipment && (
        <EquipmentFormModal
          isOpen={isEditModalOpen}
          initialData={equipment}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => loadEquipment()}
        />
      )}

      {isArchiveModalOpen && equipment && (
        <ArchiveEquipmentModal
          equipment={equipment}
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          onSuccess={() => loadEquipment()}
          onArchive={inventoryApi.archiveEquipment}
        />
      )}

      {isAttachDocModalOpen && equipment && (
        <AttachDocumentModal
          equipment={equipment}
          isOpen={isAttachDocModalOpen}
          onClose={() => setIsAttachDocModalOpen(false)}
          onSuccess={() => loadEquipment()}
        />
      )}

      {isReserveModalOpen && equipment && (
        <CreateReservationModal
          isOpen={isReserveModalOpen}
          equipment={equipment}
          onClose={() => setIsReserveModalOpen(false)}
          onSuccess={() => {
            setIsReserveModalOpen(false);
            setScheduleRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
};
