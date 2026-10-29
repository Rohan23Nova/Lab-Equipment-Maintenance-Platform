import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { LaboratoryFormModal } from '@/components/inventory/LaboratoryFormModal';
import { AssociatedExperimentsModal } from '@/components/inventory/AssociatedExperimentsModal';
import { Laboratory } from '@/types/inventory';
import { inventoryApi } from '@/lib/inventoryApi';
import { useAuth } from '@/context/AuthContext';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  MapPin,
  Pencil,
  ArrowRight,
  UserCheck,
  AlertCircle,
  BookOpen,
  Wrench,
} from 'lucide-react';

export const LaboratoryListPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLabForEdit, setSelectedLabForEdit] = useState<Laboratory | null>(null);
  const [selectedLabForExperiments, setSelectedLabForExperiments] = useState<Laboratory | null>(null);

  const canManageLabs =
    user?.roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_LAB_ASSISTANT') ?? false;

  const loadLaboratories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await inventoryApi.getLaboratories(activeOnly);
      setLaboratories(data);
    } catch (err) {
      console.error('Failed to load laboratory facilities:', err);
      setErrorMessage('Could not load laboratory facilities from the university server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    loadLaboratories();
  }, [loadLaboratories]);

  const handleEditClick = (lab: Laboratory) => {
    setSelectedLabForEdit(lab);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedLabForEdit(null);
    setIsModalOpen(true);
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Laboratory Facilities', href: '/app/laboratories' }]}>
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Laboratory Facilities & Research Bays
              </h1>
              <span className="text-xs font-mono font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                {laboratories.length} facilities
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Campus research hubs, experimental suites, and cleanrooms hosting monitored scientific instruments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/app/equipment">
              <Button variant="outline" size="sm">
                View All Equipment
              </Button>
            </Link>

            {canManageLabs && (
              <Button variant="lime" size="sm" onClick={handleCreateClick}>
                <Plus className="w-4 h-4 mr-1.5" />
                Register Facility
              </Button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveOnly(false)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                !activeOnly
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              All Facilities
            </button>
            <button
              onClick={() => setActiveOnly(true)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                activeOnly
                  ? 'bg-foreground text-background border-foreground font-semibold'
                  : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              Active Only
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => loadLaboratories()} title="Refresh list">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Facilities Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent-lime" />
              <p className="text-sm font-medium">Retrieving laboratory facilities...</p>
            </div>
          ) : laboratories.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-xl">
              <FlaskConical className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">No laboratory facilities registered</p>
              <p className="text-xs text-muted-foreground mt-1">
                Register a new laboratory bay to begin commissioning instruments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {laboratories.map((lab) => (
                <div
                  key={lab.id}
                  className="rounded-xl border border-border/80 bg-card p-5 shadow-subtle flex flex-col justify-between hover:border-border transition-all group"
                >
                  <div>
                    {/* Top row: Code + Active Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                        {lab.code}
                      </span>
                      {lab.active ? (
                        <Badge variant="available" withDot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" withDot>
                          Inactive
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {lab.name}
                    </h2>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                      <MapPin className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                      <span>
                        {lab.building} — <strong className="text-foreground">{lab.roomNumber}</strong>
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                      {lab.description || 'No specific facility description provided.'}
                    </p>

                    {/* Manager if assigned */}
                    {lab.managerName && (
                      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>Facility Manager: <strong className="text-foreground">{lab.managerName}</strong></span>
                      </div>
                    )}

                    {/* Equipment & Practical Counts (Live database values) */}
                    <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/40 rounded-lg p-2.5 flex flex-col justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-muted-foreground" />
                          Instruments
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-base font-bold text-foreground">
                            {lab.totalEquipmentCount ?? 0}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ({lab.availableEquipmentCount ?? 0} avail)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLabForExperiments(lab)}
                        className="bg-muted/40 hover:bg-muted/70 transition-colors rounded-lg p-2.5 flex flex-col justify-between text-left group/exp border border-transparent hover:border-accent-lime/30"
                      >
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-accent-lime" />
                            Practicals
                          </span>
                          <span className="text-[10px] text-primary group-hover/exp:underline">view &rarr;</span>
                        </span>
                        <div className="mt-1">
                          <span className="text-base font-bold text-foreground group-hover/exp:text-primary transition-colors">
                            {lab.experimentCount ?? 0}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                            curriculum experiments
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-3 border-t border-border/80 flex items-center justify-between">
                    <Link
                      to={`/app/equipment?laboratoryId=${lab.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Assigned Instruments</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedLabForExperiments(lab)}
                        className="h-7 px-2 text-xs rounded hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                        title="View experiments conducted in this laboratory"
                      >
                        <BookOpen className="w-3 h-3 text-accent-lime" />
                        <span>Syllabus</span>
                      </button>

                      {canManageLabs && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(lab)}
                          className="h-7 px-2 text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Laboratory Form */}
      {isModalOpen && (
        <LaboratoryFormModal
          isOpen={isModalOpen}
          initialData={selectedLabForEdit}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            toast.success('Laboratory facility saved successfully.');
            loadLaboratories();
          }}
        />
      )}

      {/* Modal: Associated Teaching Experiments */}
      {selectedLabForExperiments && (
        <AssociatedExperimentsModal
          isOpen={!!selectedLabForExperiments}
          laboratoryId={selectedLabForExperiments.id}
          laboratoryName={selectedLabForExperiments.name}
          laboratoryCode={selectedLabForExperiments.code}
          onClose={() => setSelectedLabForExperiments(null)}
        />
      )}
    </AppLayout>
  );
};
